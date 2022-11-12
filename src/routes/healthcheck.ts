import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.get("/healthcheck", { handler: getHealthcheckHandler(fastify) });

  done();
};

const getHealthcheckHandler = (fastify: FastifyInstance) => {
  return (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ status: "OK" });
  };
};
