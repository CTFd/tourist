import { createApp } from "./app";
import config from "./config";

(async () => {
  const { HOST, PORT, BODY_SIZE_LIMIT } = config;
  const bodyLimit: number = BODY_SIZE_LIMIT;
  const logger: boolean = true;

  const app = await createApp({ logger, bodyLimit }, config);

  try {
    await app.listen({ host: HOST, port: PORT });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();
