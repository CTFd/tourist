import { createApp } from "./app";

(async () => {
  let logger: boolean | object = true;
  if (process.env.NODE_ENV !== "production") {
    logger = {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    };
  }

  const app = await createApp({ logger });

  let host: string = "127.0.0.1";
  if (process.env.HOST) {
    host = process.env.HOST;
  }

  let port: number = 3000;
  if (process.env.PORT) {
    port = parseInt(process.env.PORT);
  }

  try {
    await app.listen({ host, port });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();
