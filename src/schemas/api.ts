import { Static, Type } from "@sinclair/typebox";

export enum JobBrowser {
  CHROMIUM = "CHROMIUM",
  FIREFOX = "FIREFOX",
}
export enum JobOptions {
  RECORD = "RECORD",
  SCREENSHOT = "SCREENSHOT",
  PDF = "PDF",
  READ_ALERTS = "READ_ALERTS",
}

export enum CookieSameSite {
  NONE = "None",
  LAX = "Lax",
  STRICT = "Strict",
}

export const JobStep = Type.Object(
  {
    url: Type.String(),
    actions: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
);

export type JobStepType = Static<typeof JobStep>;

export const JobCookie = Type.Object(
  {
    name: Type.String(),
    value: Type.String(),
    domain: Type.String(),
    path: Type.String({ default: "/" }),
    expires: Type.Optional(Type.Number()),
    httpOnly: Type.Boolean({ default: false }),
    secure: Type.Boolean({ default: false }),
    sameSite: Type.Optional(Type.Enum(CookieSameSite)),
  },
  { additionalProperties: false },
);

export type JobCookieType = Static<typeof JobCookie>;

export const JobResult = Type.Object({
  screenshot: Type.Optional(Type.String()),
  video: Type.Optional(Type.String()),
  pdf: Type.Optional(Type.String()),
  messages: Type.Optional(Type.Array(Type.String())),
});

export type JobResultType = Static<typeof JobResult>;

export const JobDispatchRequestHeaders = Type.Object({
  authorization: Type.Optional(Type.String()),
});

export type JobDispatchRequestHeadersType = Static<typeof JobDispatchRequestHeaders>;

export const JobDispatchRequest = Type.Object(
  {
    browser: Type.Enum(JobBrowser, { default: JobBrowser.CHROMIUM }),
    steps: Type.Array(JobStep),
    cookies: Type.Array(JobCookie, { default: [] }),
    options: Type.Array(Type.Enum(JobOptions), { default: [] }),
  },
  { additionalProperties: false },
);

export type JobDispatchRequestType = Static<typeof JobDispatchRequest>;

export const JobOperation400Reply = Type.Object({
  statusCode: Type.Literal(400),
  error: Type.String(),
  message: Type.String(),
});

export type JobOperation400ReplyType = Static<typeof JobOperation400Reply>;

export const JobOperation401Reply = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.String(),
  message: Type.String(),
});

export type JobOperation401ReplyType = Static<typeof JobOperation401Reply>;

export const JobOperation403Reply = Type.Object({
  statusCode: Type.Literal(403),
  error: Type.String(),
  message: Type.String(),
});

export type JobOperation403ReplyType = Static<typeof JobOperation403Reply>;

export const JobOperation404Reply = Type.Object({
  statusCode: Type.Literal(404),
  message: Type.String(),
  error: Type.String(),
});

export type JobOperation404ReplyType = Static<typeof JobOperation404Reply>;

export const SyncJob200Reply = Type.Object({
  status: Type.Union([Type.Literal("success"), Type.Literal("failed")]),
  result: Type.Optional(JobResult),
});

export type SyncJob200ReplyType = Static<typeof SyncJob200Reply>;

export const AsyncJob200Reply = Type.Object({
  status: Type.Literal("scheduled"),
  id: Type.Number({ minimum: 1 }),
});

export type AsyncJob200ReplyType = Static<typeof AsyncJob200Reply>;

export const AsyncJobStatusRequest = Type.Object({
  id: Type.Number({ minimum: 1 }),
});

export type AsyncJobStatusRequestType = Static<typeof AsyncJobStatusRequest>;

export const AsyncJobStatus200Reply = Type.Object({
  status: Type.Union([
    Type.Literal("success"),
    Type.Literal("pending"),
    Type.Literal("failed"),
  ]),
  result: Type.Optional(JobResult),
});

export type AsyncJobStatus200ReplyType = Static<typeof AsyncJobStatus200Reply>;
