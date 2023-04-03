import { FastifyInstance } from "fastify";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

export default (app: FastifyInstance) => {
  Sentry.init({
    // @ts-ignore: SENTRY_DSN has to be defined for this to load
    dsn: app.config.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [
      new RewriteFrames({
        root: global.__rootdir__,
      }),
    ],
  });

  app.setErrorHandler(async (error, request, reply) => {
    Sentry.captureException(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  });
};
