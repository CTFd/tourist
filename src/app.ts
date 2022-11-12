import Fastify, { FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import { createRouter } from "./router";

export const createApp = async (options: FastifyServerOptions = { logger: true }) => {
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  const router = createRouter();
  app.register(router);

  try {
    await app.ready();
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
