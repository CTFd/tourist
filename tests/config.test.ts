import test from "ava";
import config from "../src/config";

test("config has correct default values", async (t) => {
  // ava will automatically set NODE_ENV to "test"
  t.is(config.ENV, "test");
  t.is(config.DEBUG, false);
  t.is(config.REDIS_URL, "redis://127.0.0.1:6379");
  t.is(config.HOST, "127.0.0.1");
  t.is(config.PORT, 3000);
  t.is(config.ENABLE_LEGACY_API, false);
  t.is(config.ENABLE_AUTHENTICATION, true);
  t.is(config.SENTRY_DSN, false);
});
