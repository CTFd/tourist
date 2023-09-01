import os from "os";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";

import _ from "lodash";
import { parseBool } from "./utils/config";

export type TouristConfig = {
  DEBUG: boolean;
  CONCURRENCY: number;
  SECRET: string;
  ENV: string;
  REDIS_URL: string;
  HOST: string;
  PORT: number;
  BODY_SIZE_LIMIT: number;
  ENABLE_LEGACY_API: boolean;
  ENABLE_AUTHENTICATION: boolean;
  ENABLE_CORS: boolean;
  SENTRY_DSN: string | false;
  SENTRY_TRACES_SAMPLE: number;
};

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(path.join(__dirname, "..", ".env")) });
}

const getConfig = () =>
  ({
    DEBUG: parseBool(process.env.DEBUG, false),
    SECRET: process.env.SECRET || crypto.randomBytes(48).toString("hex"),
    ENV: process.env.NODE_ENV || "production",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    CONCURRENCY:
      process.env.CONCURRENCY &&
      process.env.CONCURRENCY !== "" &&
      process.env.CONCURRENCY !== "0"
        ? parseInt(process.env.CONCURRENCY)
        : os.cpus().length,
    HOST: process.env.HOST || "127.0.0.1",
    PORT: parseInt(process.env.PORT ? process.env.PORT : "3000"),
    BODY_SIZE_LIMIT: parseInt(
      process.env.BODY_SIZE_LIMIT ? process.env.BODY_SIZE_LIMIT : "26214400",
    ), // 25MB
    ENABLE_LEGACY_API: parseBool(process.env.ENABLE_LEGACY_API, false),
    ENABLE_AUTHENTICATION: parseBool(process.env.ENABLE_AUTHENTICATION, true),
    ENABLE_CORS: parseBool(process.env.ENABLE_CORS, false),
    SENTRY_DSN:
      process.env.SENTRY_DSN && process.env.SENTRY_DSN !== ""
        ? process.env.SENTRY_DSN
        : false,
    SENTRY_TRACES_SAMPLE:
      process.env.SENTRY_TRACES_SAMPLE && process.env.SENTRY_TRACES_SAMPLE !== ""
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE)
        : 0.0
  } as TouristConfig);

export default _.memoize(getConfig)();
