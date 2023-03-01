import { FastifyInstance, FastifyPluginOptions } from "fastify";
import legacy from "./routes/legacy";
import healthcheck from "./routes/healthcheck";
import api from "./routes/api";
import auth from "./routes/auth";

export const createRouter =
  () =>
  (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: (err?: Error | undefined) => void,
  ) => {
    fastify.get("/", { schema: { hide: true } }, (request, reply) => {
      reply.redirect("/docs");
    });

    if (fastify.config.ENABLE_LEGACY_API) {
      fastify.register(legacy);
    }

    if (fastify.config.ENABLE_AUTHENTICATION) {
      fastify.register(auth, { prefix: "/api/v1" });
    }

    fastify.register(healthcheck, { prefix: "/api/v1" });
    fastify.register(api, { prefix: "/api/v1" });

    done();
  };
