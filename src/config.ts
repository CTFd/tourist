import * as path from "path";
import * as dotenv from "dotenv";
import { parseBool } from "./utils/config";

export declare type TouristConfig = {
  ENV: string;
  REDIS_URL: string;
  HOST: string;
  PORT: number;
  ENABLE_LEGACY_API: boolean;
};

export const getConfig = (overrides: any = {}) => {
  dotenv.config({ path: path.resolve(path.join(__dirname, "..", ".env")) });

  return {
    ENV: process.env.NODE_ENV || "development",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    HOST: process.env.HOST || "127.0.0.1",
    PORT: parseInt(process.env.PORT ? process.env.PORT : "3000"),
    ENABLE_LEGACY_API: parseBool(process.env.ENABLE_LEGACY_API, true),
    ...overrides,
  } as TouristConfig;
};
