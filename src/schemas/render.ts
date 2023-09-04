import { Static, Type } from "@sinclair/typebox";

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

export const RenderRequestHeaders = Type.Object({
  authorization: Type.Optional(Type.String()),
});

export type RenderRequestHeadersType = Static<typeof RenderRequestHeaders>;

export const RenderRequest = Type.Object(
  {
    html: Type.String(),

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

export type RenderRequestType = Static<typeof RenderRequest>;

export const Render200Reply = Type.Object({
  status: Type.Literal("success"),
  pdf: Type.String(),
});

export type Render200ReplyType = Static<typeof Render200Reply>;

export const Render400Reply = Type.Object({
  code: Type.Optional(Type.String()),
  statusCode: Type.Literal(400),
  error: Type.String(),
  message: Type.String(),
});

export type Render400ReplyType = Static<typeof Render400Reply>;

export const Render401Reply = Type.Object({
  statusCode: Type.Literal(401),
  error: Type.String(),
  message: Type.String(),
});

export type Render401ReplyType = Static<typeof Render401Reply>;

export const Render403Reply = Type.Object({
  statusCode: Type.Literal(403),
  error: Type.String(),
  message: Type.String(),
});

export type Render403ReplyType = Static<typeof Render403Reply>;
