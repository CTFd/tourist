import Fastify, { FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

import { TouristConfig } from "./config";
import { createRouter } from "./router";
import { SwaggerConfig } from "./swagger";

export const createApp = async (
  options: FastifyServerOptions = { logger: true },
  config: TouristConfig,
) => {
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifySwagger, SwaggerConfig);

  app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
  });

  const router = createRouter(config.ENABLE_LEGACY_API);
  app.register(router);

  try {
    await app.ready();
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
