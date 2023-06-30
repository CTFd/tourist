import { Static, Type } from "@sinclair/typebox";

export const HealthcheckOKReply = Type.Object({
  status: Type.Literal("OK"),
});

export type HealthcheckOKReplyType = Static<typeof HealthcheckOKReply>;

export const HealthcheckFailingReply = Type.Object({
  status: Type.Literal("FAILING"),
});

export type HealthcheckFailingReplyType = Static<typeof HealthcheckFailingReply>;
