import Fastify, { FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

import initSentry from "./sentry";
import { TouristConfig } from "./config";
import { createRouter } from "./router";
import { SwaggerConfig } from "./swagger";
import { getIssuerToken } from "./utils/auth";

export const createApp = async (
  options: FastifyServerOptions = { logger: true },
  config: TouristConfig,
) => {
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();
  app.decorate("config", config);

  if (app.config.SENTRY_DSN) {
    initSentry(app);
  }

  app.register(fastifySwagger, SwaggerConfig);
  app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
  });

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
