import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export const initCORS = (app: FastifyInstance) => {
  if (app.config.ENABLE_CORS) {
    app.register(cors);
  }
};
