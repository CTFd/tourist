import { IncomingHttpHeaders } from "http";
import Fastify, {
  FastifyListenOptions,
  FastifyServerOptions,
  FastifyRequest,
} from "fastify";
import formbody from "@fastify/formbody";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
type RecordingRequest = FastifyRequest<{
  Querystring: { id: string };
}>;

type FormRecordingRequest = FastifyRequest<{
  Body: { fillme: string; checkme: string; id: string };
}>;

const forms: {
  [id: string]: { fillme: string; checkme: string; headers: IncomingHttpHeaders };
} = {};
const requests: { [id: string]: { headers: IncomingHttpHeaders } } = {};

export const startTestApp = async (
  serverOptions: FastifyServerOptions = { logger: false },
  listenOptions: FastifyListenOptions = {},
) => {
  const app = Fastify(serverOptions);
  app.register(formbody);

  app.get("/", (request, reply) => {
    reply.type("text/html").send("<h1>Hello World!</h1>");
  });

  // testing headers (cookies)
  app.get("/record-req", async (request: RecordingRequest, reply) => {
    requests[request.query.id] = { headers: request.headers };
    reply.type("text/html").send("<h1>Hello World!</h1>");
  });

  app.get("/inspect-req", (request: RecordingRequest, reply) => {
    reply.type("application/json").send(requests[request.query.id]);
  });

  // testing saving cookies
  app.get("/set-cookie", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply.header("set-cookie", `test_cookie=cookie-${id}`);
    reply.redirect(`/record-req?id=${id}`);
  });

  // testing loading
  app.get("/loading", (request, reply) => {
    reply.type("text/html").send("<img src='/sleep'>");
  });

  app.get("/sleep", async (request, reply) => {
    // simulate long loading
    await sleep(5000);
    reply
      .type("image/gif")
      .send(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64",
        ),
      );
  });

  // testing anchors
  app.get("/anchor", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply
      .type("text/html")
      .send(`<a href="/record-req?id=${id}" id="click">Click Me!</a>`);
  });

  // testing buttons
  app.get("/button", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply
      .type("text/html")
      .send(
        `<button onclick="window.location='/record-req?id=${id}'" id="click">Click Me!</button>`,
      );
  });

  // testing forms
  app.get("/form", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply.type("text/html").send(`
      <form action="/record-form" method="post">
        <input type="text" name="fillme" id="fillme">
        <input type="checkbox" name="checkme" id="checkme">
        <input type="hidden" value="${id}" name="id">
        <input type="submit" value="Submit" id="submit">
      </form>
    `);
  });

  app.post("/record-form", (request: FormRecordingRequest, reply) => {
    const { fillme, checkme, id } = request.body;
    forms[id] = { fillme, checkme, headers: request.headers };
    reply.type("text/html").send("<h1>Hello World!</h1>");
  });

  app.get("/inspect-form", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply.type("application/json").send(forms[id]);
  });

  // testing alerts
  app.get("/alert", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply
      .type("text/html")
      .send(`<script>alert(1); window.location='/record-req?id=${id}'</script>`);
  });

  // testing confirms
  app.get("/confirm", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply
      .type("text/html")
      .send(
        `<script>confirm('confirm?') ? window.location='/record-req?id=${id}' : window.location='/'</script>`,
      );
  });

  // testing prompts
  app.get("/prompt", (request: RecordingRequest, reply) => {
    const { id } = request.query;
    reply
      .type("text/html")
      .send(
        `<script>prompt('prompt?') === 'confirm' ? window.location='/record-req?id=${id}' : window.location='/'</script>`,
      );
  });

  try {
    await app.ready();
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  try {
    await app.listen(listenOptions);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }

  return app;
};
