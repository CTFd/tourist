import { FastifyInstance } from "fastify";
import * as Sentry from "@sentry/node";

export default (app: FastifyInstance) => {
  Sentry.init({
    // @ts-ignore: SENTRY_DSN has to be defined for this to load
    dsn: app.config.SENTRY_DSN,
    tracesSampleRate: app.config.SENTRY_TRACES_SAMPLE,
  });

  app.setErrorHandler(async (error, request, reply) => {
    Sentry.captureException(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  });
};
