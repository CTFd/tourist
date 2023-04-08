import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import { TouristConfig } from "./config";
import { createRouter } from "./router";
import { getIssuerToken } from "./utils/auth";

import { initErrorHandler } from "./loaders/error-handling";
import { initSwagger } from "./loaders/swagger";

export const createApp = async (
  options: FastifyServerOptions = { logger: true },
  config: TouristConfig,
) => {
  const app: FastifyInstance = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();
  app.decorate("config", config);

  initErrorHandler(app);
  initSwagger(app);

  const router = createRouter();
  app.register(router);

  try {
    if (app.config.ENABLE_AUTHENTICATION) {
      app.log.info(`Issuer Token: ${getIssuerToken(app.config.SECRET)}`);
    }

    await app.ready();
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
