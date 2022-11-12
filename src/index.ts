import { createApp } from "./app";

(async () => {
  const app = await createApp();

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
