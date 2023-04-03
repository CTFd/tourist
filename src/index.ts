import { createApp } from "./app";
import config from "./config";

// Sentry Typescript Integration: https://docs.sentry.io/platforms/node/typescript/
global.__rootdir__ = __dirname || process.cwd();

declare global {
  var __rootdir__: string;
}

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
