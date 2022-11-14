import { FastifyRegisterOptions } from "fastify";
import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";

export const SwaggerConfig: FastifyRegisterOptions<FastifyDynamicSwaggerOptions> = {
  openapi: {
    info: {
      title: "CTFd Tourist",
      description: "testing the fastify swagger api",
      version: "0.1.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
};
