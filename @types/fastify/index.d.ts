import { TouristConfig } from "../../src/config";

declare module 'fastify' {
  export interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse,
  > {
    config: TouristConfig
  }
}
