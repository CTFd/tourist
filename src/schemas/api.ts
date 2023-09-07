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

export enum PageFormats {
  A0 = "A0", // 841 x 1189 mm
  A1 = "A1", // 594 x 841 mm
  A2 = "A2", // 420 x 594 mm
  A3 = "A3", // 297 x 420 mm
  A4 = "A4", //  210 x 297 mm
  A5 = "A5", //  148.5 x 210 mm
  A6 = "A6", //  105 x 148.5 mm
  Letter = "Letter", // 8.5in x 11in
  Legal = "Legal", // 8.5in x 14in
  Tabloid = "Tabloid", // 11in x 17in
  Ledger = "Ledger", // 17in x 11in
}

export enum MediaOptions {
  SCREEN = "screen",
  PRINT = "print",
}

export const PDFOptions = Type.Object(
  {
    // media emulation (defaults to screen)
    media: Type.Enum(MediaOptions, { default: MediaOptions.SCREEN }),

    // format defaults to A4
    format: Type.Enum(PageFormats, { default: PageFormats.A4 }),

    // page orientation (defaults to portrait)
    landscape: Type.Boolean({ default: false }),

    // print background graphics (defaults to true)
    background: Type.Boolean({ default: true }),

    // margins can be numbers or strings with units, default to 0 in playwright
    margin: Type.Optional(
      Type.Object(
        {
          top: Type.Optional(Type.Union([Type.Number(), Type.String()])),
          right: Type.Optional(Type.Union([Type.Number(), Type.String()])),
          bottom: Type.Optional(Type.Union([Type.Number(), Type.String()])),
          left: Type.Optional(Type.Union([Type.Number(), Type.String()])),
        },
        { additionalProperties: false },
      ),
    ),

    // format takes precedence over width and height
    size: Type.Optional(
      Type.Object(
        {
          width: Type.Optional(Type.Union([Type.Number(), Type.String()])),
          height: Type.Optional(Type.Union([Type.Number(), Type.String()])),
        },
        { additionalProperties: false },
      ),
    ),

    // whether to enable javascript (defaults to true)
    js: Type.Boolean({ default: true }),

    // delay in milliseconds to wait for javascript execution (defaults to 0)
    delay: Type.Number({ default: 0, maximum: 10000 }),

    // scale of the webpage rendering (defaults to 0)
    scale: Type.Number({ default: 1.0, minimum: 0.1, maximum: 2.0 }),
  },
  { additionalProperties: false },
);

export type PDFOptionsType = Static<typeof PDFOptions>;

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
    pdf: Type.Optional(PDFOptions),
  },
  { additionalProperties: false },
);

export type JobDispatchRequestType = Static<typeof JobDispatchRequest>;

export const JobOperation400Reply = Type.Object({
  code: Type.Optional(Type.String()),
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
