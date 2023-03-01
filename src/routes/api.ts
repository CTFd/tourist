import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import _ from "lodash";

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
    Reply: AsyncJob200ReplyType | AsyncJob400ReplyType;
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
    Reply: SyncJob200ReplyType | SyncJob400ReplyType;
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
    Reply: AsyncJobStatus200ReplyType | AsyncJobStatus404ReplyType;
  }>("/job-status", {
    schema: {
      querystring: AsyncJobStatusRequest,
      response: {
        200: AsyncJobStatus200Reply,
        404: AsyncJobStatus404Reply,
      },
    },
    handler: getAsyncJobStatusHandler(fastify),
  });

  done();
};

const authenticateDispatchRequest = (request: FastifyRequest, secret: string) => {
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
  if (!authenticateVisitToken(authorization, visitURLs, secret)) {
    return {
      statusCode: 403,
      error: "Forbidden",
      message:
        "Provided token does not allow visiting one or more of the requested URLs",
    };
  }

  return true;
};

const authenticateStatusRequest = (
  request: FastifyRequest,
  data: VisitJobData,
  secret: string,
) => {
  const { authorization } = <JobDispatchRequestHeadersType>request.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      error: "Unauthenticated",
      message: "Authorization has not been provided",
    };
  }

  const visitURLs = _.map(data.steps, "url");
  if (!authenticateVisitToken(authorization, visitURLs, secret)) {
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
      const authenticationResult = authenticateDispatchRequest(
        request,
        fastify.config.SECRET,
      );

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
      const authenticationResult = authenticateDispatchRequest(
        request,
        fastify.config.SECRET,
      );
      if (authenticationResult !== true) {
        return reply.status(authenticationResult.statusCode).send(authenticationResult);
      }
    }

    const jobResult = await syncVisitJob(data);
    return reply.send({ status: "success", result: jobResult });
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
      const authenticationResult = authenticateStatusRequest(
        request,
        job.data,
        fastify.config.SECRET,
      );

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
