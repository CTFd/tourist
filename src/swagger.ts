import * as fs from "fs";
import * as path from "path";

import { FastifyRegisterOptions } from "fastify";
import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";

const PkgPath = path.normalize(path.join(__dirname, "..", "package.json"));
const PKG = JSON.parse(fs.readFileSync(PkgPath).toString());

export const SwaggerConfig: FastifyRegisterOptions<FastifyDynamicSwaggerOptions> = {
  openapi: {
    info: {
      title: PKG.name,
      description: PKG.description,
      version: PKG.version,
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
};
