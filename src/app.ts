import Fastify, { FastifyServerOptions } from "fastify";

export const createApp = async (options: FastifyServerOptions = { logger: true }) => {
  const app = Fastify(options);

  app.get("/", (request, reply) => {
    reply.send({ hello: "world" });
  });

  try {
    await app.ready();
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
