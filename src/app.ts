import * as fs from "fs";
import * as path from "path";

import Fastify, { FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import fastifySwagger from "@fastify/swagger";
import fastifyStatic from "@fastify/static";
import fastifySwaggerUI from "@fastify/swagger-ui";

import { createRouter } from "./router";
import { SwaggerConfig } from "./swagger";

declare type AdditionalOptions = {
  staticPath?: string;
};

export const createApp = async (
  options: FastifyServerOptions = { logger: true },
  additionalOptions: AdditionalOptions = {},
) => {
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifySwagger, SwaggerConfig);

  let StaticPath: string;
  if (additionalOptions.staticPath) {
    const staticPath = path.resolve(additionalOptions.staticPath);

    if (!fs.existsSync(staticPath)) {
      app.log.error(`Custom static directory '${staticPath}' does not exist!`);
      process.exit(2);
    }

    StaticPath = staticPath;
  } else {
    const staticPath = path.normalize(path.join(__dirname, "..", "static"));

    // only create the static directory if it's the default ./static
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath);
    }

    StaticPath = staticPath;
  }

  app.register(fastifyStatic, {
    root: StaticPath,
  });

  app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
  });

  const router = createRouter();
  app.register(router);

  try {
    await app.ready();
    const openapi = JSON.stringify(app.swagger());

    fs.writeFileSync(path.join(StaticPath, "openapi.json"), openapi);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
