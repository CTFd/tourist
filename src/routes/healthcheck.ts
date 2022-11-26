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
  fastify.get("/healthcheck", { handler: handleHealthcheck });

  done();
};

const handleHealthcheck = (request: FastifyRequest, reply: FastifyReply) => {
  reply.send({ status: "OK" });
};
