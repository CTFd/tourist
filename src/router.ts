import { FastifyInstance, FastifyPluginOptions } from "fastify";
import legacy from "./routes/legacy";
import healthcheck from "./routes/healthcheck";

export const createRouter =
  () =>
  (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: (err?: Error | undefined) => void,
  ) => {
    fastify.register(legacy);
    fastify.register(healthcheck, { prefix: "/api" });

    done();
  };
