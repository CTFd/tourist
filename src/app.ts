import * as fs from "fs";
import * as path from "path";

import Fastify, { FastifyServerOptions } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import fastifySwagger from "@fastify/swagger";
import fastifyStatic from "@fastify/static";

import { createRouter } from "./router";
import { SwaggerConfig } from "./swagger";

export const createApp = async (options: FastifyServerOptions = { logger: true }) => {
  const app = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifySwagger, SwaggerConfig);

  const StaticPath = path.resolve("static");
  if (!fs.existsSync(StaticPath)){
    fs.mkdirSync(StaticPath)
  }

  app.register(fastifyStatic, {
    root: path.resolve(path.join("static")),
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
