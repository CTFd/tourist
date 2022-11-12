import { Static, Type } from "@sinclair/typebox";

export const LegacyStep = Type.Object({
  url: Type.String(),
  actions: Type.Optional(Type.Array(Type.String())),
});

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

export const LegacyVisitReply = Type.Object({
  status: Type.Union([Type.Literal("ok"), Type.Literal("failed")]),
  screenshot: Type.Optional(Type.String()),
  video: Type.Optional(Type.String()),
  pdf: Type.Optional(Type.String()),
});
export type LegacyVisitReplyType = Static<typeof LegacyVisitReply>;
