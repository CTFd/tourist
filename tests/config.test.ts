import test from "ava";
import { getConfig } from "../src/config";

test("getConfig has correct default values", async (t) => {
  const config = getConfig();

  // ava will automatically set NODE_ENV to "test"
  t.is(config.ENV, "test");
  t.is(config.REDIS_URL, "redis://127.0.0.1:6379");
  t.is(config.HOST, "127.0.0.1");
  t.is(config.PORT, 3000);
  t.is(config.ENABLE_LEGACY_API, true);
});

test("getConfig can be overridden", async (t) => {
  const config = getConfig({ ENV: "testing", ENABLE_LEGACY_API: false });

  t.is(config.ENV, "testing");
  t.is(config.REDIS_URL, "redis://127.0.0.1:6379");
  t.is(config.HOST, "127.0.0.1");
  t.is(config.PORT, 3000);
  t.is(config.ENABLE_LEGACY_API, false);
});
