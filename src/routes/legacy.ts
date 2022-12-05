import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  LegacyVisitRequestType,
  LegacyVisit200ReplyType,
  LegacyVisit400ReplyType,
  LegacyVisitRequest,
  LegacyVisit200Reply,
  LegacyVisit400Reply,
} from "../schemas/legacy";
import { validateActions } from "../utils/validation";
import { camelizeLegacyActions } from "../utils/legacy/actions";
import { legacyReturningVisitJob } from "../jobs/legacy";
import { LegacySimpleVisitQueue } from "../queue";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.post<{
    Body: LegacyVisitRequestType;
    Reply: LegacyVisit200ReplyType | LegacyVisit400ReplyType;
  }>("/visit", {
    schema: {
      body: LegacyVisitRequest,
      response: { 200: LegacyVisit200Reply, 400: LegacyVisit400Reply },
    },
    handler: handleVisit,
  });

  done();
};

const handleVisit = async (request: FastifyRequest, reply: FastifyReply) => {
  const { steps, cookies, record, screenshot, pdf } = <LegacyVisitRequestType>(
    request.body
  );

  if ([record, screenshot, pdf].filter(Boolean).length > 1) {
    reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Exactly one option of [record, screenshot, pdf] can be used at a time",
    });
  }

  for (const step of steps) {
    if (step.actions) {
      try {
        validateActions(step.actions);
      } catch (e: any) {
        request.log.error(e.message);

        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: e.message,
        });
      }
    }
  }

  for (const step of steps) {
    if (step.actions) {
      step.actions = camelizeLegacyActions(step.actions);
    }
  }

  // dispatch a background job if it's a simple visit request
  if (!record && !screenshot && !pdf) {
    await LegacySimpleVisitQueue.add({
      steps,
      cookies,
    });

    return reply.send({ status: "scheduled" });
  }

  // wait for the job to finish if it needs to return data
  try {
    const data = await legacyReturningVisitJob({
      steps,
      cookies,
      record,
      screenshot,
      pdf,
    });

    return reply.send(data);
  } catch (e: any) {
    request.log.error(e);
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: e.message,
    });
  }
};
