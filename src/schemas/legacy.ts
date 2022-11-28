import { Static, Type } from "@sinclair/typebox";

export const LegacyStep = Type.Object({
  url: Type.String(),
  actions: Type.Optional(Type.Array(Type.String())),
});

export type LegacyStepType = Static<typeof LegacyStep>;

export const LegacyCookie = Type.Object(
  {
    name: Type.String(),
    value: Type.String(),
    domain: Type.String(),
    path: Type.String({ default: "/" }),
    expires: Type.Optional(Type.Number()),
    httpOnly: Type.Boolean({ default: false }),
    secure: Type.Boolean({ default: false }),

    // TODO: This doesn't appear to work, cookies will not get attached if sameSite is present
    //  sameSite: Type.Union(
    //    [Type.Literal("Strict"), Type.Literal("Lax"), Type.Literal("None")],
    //    { default: "None" },
    //  ),
  },
  { additionalProperties: false },
);

export type LegacyCookieType = Static<typeof LegacyCookie>;

export const LegacyVisitRequest = Type.Object(
  {
    steps: Type.Array(LegacyStep),
    cookies: Type.Array(LegacyCookie, { default: [] }),
    record: Type.Boolean({ default: false }),
    screenshot: Type.Boolean({ default: false }),
    pdf: Type.Boolean({ default: false }),
  },
  { additionalProperties: false },
);
export type LegacyVisitRequestType = Static<typeof LegacyVisitRequest>;

export const LegacyVisit400Reply = Type.Object({
  statusCode: Type.Literal(400),
  error: Type.String(),
  message: Type.String(),
});
export type LegacyVisit400ReplyType = Static<typeof LegacyVisit400Reply>;

export const LegacyVisit200Reply = Type.Object({
  status: Type.Union([Type.Literal("success"), Type.Literal("scheduled")]),
  result: Type.Optional(
    Type.Object({
      screenshot: Type.Optional(Type.String()),
      video: Type.Optional(Type.String()),
      pdf: Type.Optional(Type.String()),
    }),
  ),
});
export type LegacyVisit200ReplyType = Static<typeof LegacyVisit200Reply>;
