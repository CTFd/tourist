import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  JobDispatchRequest,
  JobDispatchRequestType,
  JobResultType,
  AsyncJob200Reply,
  AsyncJob200ReplyType,
  AsyncJob400Reply,
  AsyncJob400ReplyType,
  AsyncJobStatusRequest,
  AsyncJobStatusRequestType,
  AsyncJobStatus200Reply,
  AsyncJobStatus200ReplyType,
  AsyncJobStatus404Reply,
  AsyncJobStatus404ReplyType,
  SyncJob200Reply,
  SyncJob200ReplyType,
  SyncJob400Reply,
  SyncJob400ReplyType,
} from "../schemas/api";
import { syncVisitJob } from "../jobs/api";
import { AsyncVisitQueue } from "../queue";
import { validateActions } from "../utils/validation";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.post<{
    Body: JobDispatchRequestType;
    Reply: AsyncJob200ReplyType | AsyncJob400ReplyType;
  }>("/async-job", {
    schema: {
      body: JobDispatchRequest,
      response: {
        200: AsyncJob200Reply,
        400: AsyncJob400Reply,
      },
    },
    handler: handleAsyncJob,
  });

  fastify.post<{
    Body: JobDispatchRequestType;
    Reply: SyncJob200ReplyType | SyncJob400ReplyType;
  }>("/sync-job", {
    schema: {
      body: JobDispatchRequest,
      response: {
        200: SyncJob200Reply,
        400: SyncJob400Reply,
      },
    },
    handler: handleSyncJob,
  });

  fastify.get<{
    Querystring: AsyncJobStatusRequestType;
    Reply: AsyncJobStatus200ReplyType | AsyncJobStatus404ReplyType;
  }>("/job-status", {
    schema: {
      querystring: AsyncJobStatusRequest,
      response: {
        200: AsyncJobStatus200Reply,
        404: AsyncJobStatus404Reply,
      },
    },
    handler: handleAsyncJobStatus,
  });

  done();
};

const handleAsyncJob = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = <JobDispatchRequestType>request.body;

  for (const step of data.steps) {
    if (step.actions) {
      try {
        validateActions(step.actions);
      } catch (e: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Action validation failed",
          message: e.message,
        });
      }
    }
  }

  const job = await AsyncVisitQueue.add(data);
  return reply.send({ status: "scheduled", id: job.id });
};

const handleSyncJob = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = <JobDispatchRequestType>request.body;

  for (const step of data.steps) {
    if (step.actions) {
      try {
        validateActions(step.actions);
      } catch (e: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Action validation failed",
          message: e.message,
        });
      }
    }
  }

  const result = await syncVisitJob(data);
  return reply.send({ status: "success", result });
};

const handleAsyncJobStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = <AsyncJobStatusRequestType>request.query;
  const job = await AsyncVisitQueue.getJob(id);

  if (!job) {
    return reply
      .status(404)
      .send({ statusCode: 404, error: `Job with id "${id}" does not exist!` });
  }

  const state = await job.getState();
  if (state === "completed") {
    const result = <JobResultType>job.returnvalue;
    return reply.send({ status: "success", result });
  }

  if (["waiting", "active", "delayed", "paused"].includes(state)) {
    return reply.send({ status: "pending" });
  }

  if (state === "stuck") {
    await job.moveToFailed({ message: "Job is stuck" });
    return reply.send({ status: "failed" });
  }

  if (state === "failed") {
    return reply.send({ status: "failed" });
  }

  return reply.status(500).send({ message: `Unknown job state "${state}"` });
};
