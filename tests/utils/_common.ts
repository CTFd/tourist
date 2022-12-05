import net from "net";
import { FastifyInstance } from "fastify";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const base64regex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

export const asyncJobResult = async (
  app: FastifyInstance,
  id: number,
  interval: number = 250,
): Promise<any> => {
  while (true) {
    await sleep(interval);

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/job-status?id=${id}`,
    });

    const data = response.json();
    if (data.status !== "pending") {
      return data;
    }
  }
};
export const getFreePort = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();

      if (address) {
        if (typeof address === "object") {
          const { port } = address;
          srv.close((err) => resolve(port));
        } else {
          srv.close((err) => reject());
        }
      }
    });
  });
};
