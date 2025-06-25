import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { syncVisitJob, VisitJobData } from "../jobs/api";
import { JobBrowser, JobOptions } from "../schemas/api";

import {
  HealthcheckOKReply,
  HealthcheckOKReplyType,
  HealthcheckFailingReply,
  HealthcheckFailingReplyType,
} from "../schemas/healthcheck";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.get<{
    Reply: HealthcheckOKReplyType | HealthcheckFailingReplyType;
  }>("/healthcheck", {
    schema: {
      response: {
        200: HealthcheckOKReply,
        500: HealthcheckFailingReply,
      },
    },
    handler: handleHealthcheck,
  });

  done();
};

const EXPECTED_SCREENSHOT_LENGTH = 39348;

const handleHealthcheck = async (request: FastifyRequest, reply: FastifyReply) => {
  const data: VisitJobData = {
    browser: JobBrowser.CHROMIUM,
    steps: [{ url: "https://example.com" }],
    cookies: [],
    options: [JobOptions.SCREENSHOT],
  };

  const { screenshot } = await syncVisitJob(data);
  if (screenshot) {
    // +/- 20% difference accepted as screenshots will differ slightly
    if (
      Math.floor(0.8 * EXPECTED_SCREENSHOT_LENGTH) < screenshot.length &&
      Math.ceil(1.2 * EXPECTED_SCREENSHOT_LENGTH) > screenshot.length
    )
      return reply.send({ status: "OK" });
  }

  return reply.status(500).send({ status: "FAILING" });
};
