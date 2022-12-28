import { Static, Type } from "@sinclair/typebox";

export const IssueTokenRequestHeaders = Type.Object({
  authorization: Type.String(),
});
export type IssueTokenRequestHeadersType = Static<typeof IssueTokenRequestHeaders>;

export const IssueTokenRequest = Type.Object(
  {
    // default to 168h / 7 days / 1 week
    validity: Type.Number({ default: 604800 }),
    scope: Type.String(),
    strict: Type.Boolean({ default: false }),
  },
  { additionalProperties: false },
);
export type IssueTokenRequestType = Static<typeof IssueTokenRequest>;

export const IssueToken200Reply = Type.Object({
  token: Type.String(),
});

export type IssueToken200ReplyType = Static<typeof IssueToken200Reply>;

export const IssueToken401Reply = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.String(),
  message: Type.String(),
});

export type IssueToken401ReplyType = Static<typeof IssueToken401Reply>;
