import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";

import { parseBool } from "./utils/config";

export declare type TouristConfig = {
  SECRET: string;
  ENV: string;
  REDIS_URL: string;
  HOST: string;
  PORT: number;
  ENABLE_LEGACY_API: boolean;
  ENABLE_AUTHENTICATION: boolean;
  SENTRY_DSN: string | false;
};

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(path.join(__dirname, "..", ".env")) });
}

export default {
  SECRET: process.env.SECRET || crypto.randomBytes(48).toString("hex"),
  ENV: process.env.NODE_ENV || "production",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  HOST: process.env.HOST || "127.0.0.1",
  PORT: parseInt(process.env.PORT ? process.env.PORT : "3000"),
  ENABLE_LEGACY_API: parseBool(process.env.ENABLE_LEGACY_API, false),
  ENABLE_AUTHENTICATION: parseBool(process.env.ENABLE_AUTHENTICATION, true),
  SENTRY_DSN:
    process.env.SENTRY_DSN && process.env.SENTRY_DSN !== ""
      ? process.env.SENTRY_DSN
      : false,
} as TouristConfig;
