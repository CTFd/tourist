import net from "net";
import { FastifyInstance, InjectOptions } from "fastify";
import config from "../../src/config";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const base64regex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

export const asyncJobResult = async (
  app: FastifyInstance,
  id: number,
  token: string | false = false,
  interval: number = 250,
): Promise<any> => {
  while (true) {
    await sleep(interval);

    let options: InjectOptions;
    if (!token) {
      options = {
        method: "GET",
        url: `/api/v1/job-status?id=${id}`,
      };
    } else {
      options = {
        method: "GET",
        url: `/api/v1/job-status?id=${id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const response = await app.inject(options);
    const data = response.json();
    if (!data.status || data.status !== "pending") {
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
export const getTestConfig = (overrides: any = {}) => {
  return {
    ...config,
    ...overrides,
  };
};

export const timestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};
