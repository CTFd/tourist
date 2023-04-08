import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";

export const initErrorHandler = (app: FastifyInstance) => {
  if (app.config.SENTRY_DSN) {
    app.log.info("Sentry Reporting Enabled");
    Sentry.init({
      dsn: app.config.SENTRY_DSN,
      tracesSampleRate: app.config.SENTRY_TRACES_SAMPLE,
    });
  }

  app.setErrorHandler(
    async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      if (!reply.statusCode || reply.statusCode === 200) {
        if (error.statusCode && error.statusCode >= 400) {
          return reply.code(error.statusCode).send(error);
        }
      }

      // only log and capture 500s - not validation errors
      request.log.error(error);
      if (app.config.SENTRY_DSN) {
        Sentry.captureException(error);
      }

      return reply.code(500).send(new Error("Internal Server Error"));
    },
  );
};
