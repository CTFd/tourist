// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./_app";

(async () => {
  await startTestApp({ logger: true }, { host: "localhost", port: 5000 });
})();
