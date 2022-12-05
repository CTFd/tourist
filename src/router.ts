import { FastifyInstance, FastifyPluginOptions } from "fastify";
import legacy from "./routes/legacy";
import healthcheck from "./routes/healthcheck";
import api from "./routes/api";

export const createRouter =
  (enableLegacyAPI: boolean = true) =>
  (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: (err?: Error | undefined) => void,
  ) => {
    fastify.get("/", (request, reply) => {
      reply.redirect("/docs");
    });

    if (enableLegacyAPI) {
      fastify.register(legacy);
    }

    fastify.register(healthcheck, { prefix: "/api/v1" });
    fastify.register(api, { prefix: "/api/v1" });

    done();
  };
