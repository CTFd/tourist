import { createApp } from "./app";

(async () => {
  const app = await createApp();

  let port: number = 3000;
  if (process.env.PORT) {
    port = parseInt(process.env.PORT);
  }

  try {
    await app.listen({ port });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
})();
