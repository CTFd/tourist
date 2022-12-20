import { Static, Type } from "@sinclair/typebox";

export enum JobBrowser {
  CHROMIUM = "CHROMIUM",
  FIREFOX = "FIREFOX",
}
export enum JobOptions {
  RECORD = "RECORD",
  SCREENSHOT = "SCREENSHOT",
  PDF = "PDF",
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
    // TODO: sameSite
  },
  { additionalProperties: false },
);

export type JobCookieType = Static<typeof JobCookie>;

export const JobResult = Type.Object({
  screenshot: Type.Optional(Type.String()),
  video: Type.Optional(Type.String()),
  pdf: Type.Optional(Type.String()),
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

export const SyncJob200Reply = Type.Object({
  status: Type.Union([Type.Literal("success"), Type.Literal("failed")]),
  result: Type.Optional(JobResult),
});

export type SyncJob200ReplyType = Static<typeof SyncJob200Reply>;

export const SyncJob400Reply = Type.Object({
  statusCode: Type.Literal(400),
  error: Type.String(),
  message: Type.String(),
});

export type SyncJob400ReplyType = Static<typeof SyncJob400Reply>;

export const SyncJob401Reply = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.String(),
  message: Type.String(),
});

export type SyncJob401ReplyType = Static<typeof SyncJob401Reply>;

export const SyncJob403Reply = Type.Object({
  statusCode: Type.Literal(403),
  error: Type.String(),
  message: Type.String(),
});

export type SyncJob403ReplyType = Static<typeof SyncJob403Reply>;

export const AsyncJob200Reply = Type.Object({
  status: Type.Literal("scheduled"),
  id: Type.Number({ minimum: 1 }),
});

export type AsyncJob200ReplyType = Static<typeof AsyncJob200Reply>;

export const AsyncJob400Reply = Type.Object({
  statusCode: Type.Literal(400),
  error: Type.String(),
  message: Type.String(),
});

export type AsyncJob400ReplyType = Static<typeof AsyncJob400Reply>;

export const AsyncJob401Reply = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.String(),
  message: Type.String(),
});

export const AsyncJob403Reply = Type.Object({
  statusCode: Type.Literal(403),
  error: Type.String(),
  message: Type.String(),
});

export type AsyncJob403ReplyType = Static<typeof AsyncJob403Reply>;

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

export const AsyncJobStatus404Reply = Type.Object({
  statusCode: Type.Literal(404),
  message: Type.String(),
  error: Type.String(),
});

export type AsyncJobStatus404ReplyType = Static<typeof AsyncJobStatus404Reply>;
