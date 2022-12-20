import { createApp } from "./app";
import config from "./config";

(async () => {
  let logger: boolean = true;
  const app = await createApp({ logger }, config);

  try {
    const { HOST, PORT } = config;
    await app.listen({ host: HOST, port: PORT });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();
