import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import jwt from "jsonwebtoken";

import {
  IssueToken200Reply,
  IssueToken200ReplyType,
  IssueToken401Reply,
  IssueToken401ReplyType,
  IssueTokenRequest,
  IssueTokenRequestHeaders,
  IssueTokenRequestHeadersType,
  IssueTokenRequestType,
} from "../schemas/auth";
import { authenticateIssuerToken } from "../utils/auth";

export default (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) => {
  fastify.post<{
    Body: IssueTokenRequestType;
    Reply: IssueToken200ReplyType | IssueToken401ReplyType;
  }>("/issue-token", {
    schema: {
      headers: IssueTokenRequestHeaders,
      body: IssueTokenRequest,
      response: {
        200: IssueToken200Reply,
        401: IssueToken401Reply,
      },
    },
    handler: getIssueTokenHandler(fastify),
  });

  done();
};

const getIssueTokenHandler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { authorization } = <IssueTokenRequestHeadersType>request.headers;
    const { validity, scope, strict } = <IssueTokenRequestType>request.body;

    if (!authenticateIssuerToken(authorization, fastify.config.SECRET)) {
      return reply.status(401).send({
        statusCode: 401,
        error: "Invalid Issuer Token",
        message: "Authorization header is either missing, malformed or incorrect",
      });
    }

    const payload = {
      scope,
      strict,
    };

    const token = jwt.sign(payload, fastify.config.SECRET, { expiresIn: validity });
    reply.send({ token });
  };
};
