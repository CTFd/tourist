import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  RenderRequestHeaders,
  RenderRequestHeadersType,
  RenderRequest,
  RenderRequestType,
  Render200Reply,
  Render200ReplyType,
  Render400Reply,
  Render400ReplyType,
  Render401Reply,
  Render403Reply,
  Render401ReplyType,
  Render403ReplyType,
} from "../schemas/render";
import { PlaywrightRenderer } from "../utils/renderer";
import { authenticateToken } from "../utils/auth";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.post<{
    Body: RenderRequestType;
    Reply:
      | Render200ReplyType
      | Render400ReplyType
      | Render401ReplyType
      | Render403ReplyType;
  }>("/render", {
    schema: {
      body: RenderRequest,
      response: {
        200: Render200Reply,
        400: Render400Reply,
        401: Render401Reply,
        403: Render403Reply,
      },
    },
    handler: getRenderHandler(fastify),
  });

  done();
};

const authenticateRenderRequest = (
  request: FastifyRequest,
): true | Render401ReplyType | Render403ReplyType => {
  const { authorization } = <RenderRequestHeadersType>request.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      error: "Unauthenticated",
      message: "Authorization has not been provided",
    };
  }

  if (!authenticateToken(authorization)) {
    return {
      statusCode: 403,
      error: "Forbidden",
      message: "Provided token does not allow rendering PDFs",
    };
  }

  return true;
};

const getRenderHandler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = <RenderRequestType>request.body;

    if (fastify.config.ENABLE_AUTHENTICATION) {
      const authenticationResult = authenticateRenderRequest(request);

      if (authenticationResult !== true) {
        return reply.status(authenticationResult.statusCode).send(authenticationResult);
      }
    }

    try {
      const renderer = new PlaywrightRenderer(data, fastify.config.DEBUG);
      await renderer.init();
      const pdf = await renderer.render();
      await renderer.teardown();
      return reply.send({ status: "success", pdf });
    } catch (e: any) {
      return reply.send({ statusCode: 400, error: "Bad Request", message: e.message });
    }
  };
};
