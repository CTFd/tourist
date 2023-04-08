import fs from "fs";
import path from "path";

import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import fastifySwagger, { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

const PkgPath: string = path.normalize(
  path.join(__dirname, "..", "..", "package.json"),
);
const PKG: { name: string; description: string; version: string } = JSON.parse(
  fs.readFileSync(PkgPath).toString(),
);

const SwaggerConfig: FastifyRegisterOptions<FastifyDynamicSwaggerOptions> = {
  openapi: {
    info: {
      title: PKG.name,
      description: PKG.description,
      version: PKG.version,
    },
  },
};

export const initSwagger = (app: FastifyInstance) => {
  app.register(fastifySwagger, SwaggerConfig);
  app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
  });
};
