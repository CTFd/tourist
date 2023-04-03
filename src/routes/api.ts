import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import _ from "lodash";
import * as Sentry from "@sentry/node";

import {
  JobDispatchRequest,
  JobDispatchRequestType,
  JobDispatchRequestHeaders,
  JobDispatchRequestHeadersType,
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
  AsyncJob401Reply,
  AsyncJob403Reply,
  SyncJob401Reply,
  SyncJob403Reply,
  SyncJob401ReplyType,
  SyncJob403ReplyType,
  AsyncJob403ReplyType,
  AsyncJob401ReplyType,
  AsyncJobStatus401Reply,
  AsyncJobStatus403Reply,
  AsyncJobStatus401ReplyType,
  AsyncJobStatus403ReplyType,
} from "../schemas/api";
import { AsyncVisitQueue } from "../queue";
import { syncVisitJob, VisitJobData } from "../jobs/api";
import { authenticateVisitToken } from "../utils/auth";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.post<{
    Headers: JobDispatchRequestHeadersType;
    Body: JobDispatchRequestType;
    Reply:
      | AsyncJob200ReplyType
      | AsyncJob400ReplyType
      | AsyncJob401ReplyType
      | AsyncJob403ReplyType;
  }>("/async-job", {
    schema: {
      headers: JobDispatchRequestHeaders,
      body: JobDispatchRequest,
      response: {
        200: AsyncJob200Reply,
        400: AsyncJob400Reply,
        401: AsyncJob401Reply,
        403: AsyncJob403Reply,
      },
    },
    handler: getAsyncJobHandler(fastify),
  });

  fastify.post<{
    Headers: JobDispatchRequestHeadersType;
    Body: JobDispatchRequestType;
    Reply:
      | SyncJob200ReplyType
      | SyncJob400ReplyType
      | SyncJob401ReplyType
      | SyncJob403ReplyType;
  }>("/sync-job", {
    schema: {
      body: JobDispatchRequest,
      response: {
        200: SyncJob200Reply,
        400: SyncJob400Reply,
        401: SyncJob401Reply,
        403: SyncJob403Reply,
      },
    },
    handler: getSyncJobHandler(fastify),
  });

  fastify.get<{
    Querystring: AsyncJobStatusRequestType;
    Reply:
      | AsyncJobStatus200ReplyType
      | AsyncJobStatus401ReplyType
      | AsyncJobStatus403ReplyType
      | AsyncJobStatus404ReplyType;
  }>("/job-status", {
    schema: {
      querystring: AsyncJobStatusRequest,
      response: {
        200: AsyncJobStatus200Reply,
        401: AsyncJobStatus401Reply,
        403: AsyncJobStatus403Reply,
        404: AsyncJobStatus404Reply,
      },
    },
    handler: getAsyncJobStatusHandler(fastify),
  });

  done();
};

const authenticateDispatchRequest = (request: FastifyRequest) => {
  const data = <JobDispatchRequestType>request.body;
  const { authorization } = <JobDispatchRequestHeadersType>request.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      error: "Unauthenticated",
      message: "Authorization has not been provided",
    };
  }

  const visitURLs = _.map(data.steps, "url");
  if (!authenticateVisitToken(authorization, visitURLs)) {
    return {
      statusCode: 403,
      error: "Forbidden",
      message:
        "Provided token does not allow visiting one or more of the requested URLs",
    };
  }

  return true;
};

const authenticateStatusRequest = (request: FastifyRequest, data: VisitJobData) => {
  const { authorization } = <JobDispatchRequestHeadersType>request.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      error: "Unauthenticated",
      message: "Authorization has not been provided",
    };
  }

  const visitURLs = _.map(data.steps, "url");
  if (!authenticateVisitToken(authorization, visitURLs)) {
    return {
      statusCode: 403,
      error: "Forbidden",
      message: "Provided token does not allow retrieving data for this job",
    };
  }

  return true;
};

const getAsyncJobHandler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = <JobDispatchRequestType>request.body;

    if (fastify.config.ENABLE_AUTHENTICATION) {
      const authenticationResult = authenticateDispatchRequest(request);

      if (authenticationResult !== true) {
        return reply.status(authenticationResult.statusCode).send(authenticationResult);
      }
    }

    const job = await AsyncVisitQueue.add(data);
    return reply.send({ status: "scheduled", id: job.id });
  };
};

const getSyncJobHandler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = <JobDispatchRequestType>request.body;

    if (fastify.config.ENABLE_AUTHENTICATION) {
      const authenticationResult = authenticateDispatchRequest(request);

      if (authenticationResult !== true) {
        return reply.status(authenticationResult.statusCode).send(authenticationResult);
      }
    }

    try {
      const jobResult = await syncVisitJob(data);
      return reply.send({ status: "success", result: jobResult });
    } catch (e: any) {
      if (fastify.config.SENTRY_DSN) {
        Sentry.captureException(e);
      }

      return reply
        .status(400)
        .send({ statusCode: 400, error: "Bad Request", message: e.message });
    }
  };
};

const getAsyncJobStatusHandler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = <AsyncJobStatusRequestType>request.query;
    const job = await AsyncVisitQueue.getJob(id);

    if (!job) {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: `Job with id '${id}' does not exist!`,
      });
    }

    if (fastify.config.ENABLE_AUTHENTICATION) {
      const authenticationResult = authenticateStatusRequest(request, job.data);

      if (authenticationResult !== true) {
        return reply.status(authenticationResult.statusCode).send(authenticationResult);
      }
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
};
