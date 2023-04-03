import { FastifyInstance } from "fastify";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

// Sentry Typescript Integration: https://docs.sentry.io/platforms/node/typescript/
global.__rootdir__ = __dirname || process.cwd();

declare global {
  var __rootdir__: string;
}

export default (app: FastifyInstance) => {
  Sentry.init({
    // @ts-ignore: SENTRY_DSN has to be defined for this to load
    dsn: app.config.SENTRY_DSN,
    tracesSampleRate: app.config.SENTRY_TRACES_SAMPLE,
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
