import { WebSocketServer } from "ws";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import { LOGGING } from "../config";
import {
  BApp,
  BMethod,
  BMiddleware,
  BRequest,
  BResponse,
  BRoute,
  BRouteHandler,
  BRouteWebsocketHandler,
} from "../types";
import { Stream, Readable } from "stream";
import { corsHeaders } from "../middlewares/cors";
import Api from "../../../common/src/types/api";

const app = fastify({
  logger: LOGGING,
  bodyLimit: 30 * 1024 * 1024, // Default Limit set to 30MB
});

// app.addContentTypeParser('*', (req:any, done:any) => {
//     done()
// })

const cookieParser = (cookie: string) => {
  const cookies: { [key: string]: string } = {};
  cookie.split(";").forEach((c) => {
    const parts = c.split("=");
    cookies[parts[0].trim().toLowerCase()] = parts[1]?.trim() || "";
  });
  return cookies;
};

const run = async (
  handler: BRouteHandler,
  req: FastifyRequest,
  res: FastifyReply,
  ...middlewares: BMiddleware[]
) => {
  const receivedAt = Date.now();

  const breq: BRequest = {
    method: req.method.toLowerCase() as BMethod,
    path: req.url,
    params: (req.params !== undefined ? req.params : {}) as {
      [key: string]: string;
    },
    query: (req.query !== undefined ? req.query : {}) as {
      [key: string]: string;
    },
    body: (req.body !== undefined ? req.body : {}) as { [key: string]: any },
    headers: (req.headers !== undefined ? req.headers : {}) as {
      [key: string]: string;
    },
    cookies: (req.headers?.cookie !== undefined
      ? cookieParser(req.headers?.cookie)
      : {}) as { [key: string]: string },
    middlewares: [],
    extras: {},
  };

  const bres: BResponse = {
    headers: {
      ...res.headers,
    },
    status: (code: number) => {
      res.status(code);
      return bres;
    },
    send: <T>(data: T) => {
      res.headers(bres.headers);
      const response: Api.ApiResponse<T> = {
        meta: {
          time: Date.now() - receivedAt,
          code: res.statusCode,
        },
        data,
      };
      res.send(response);
      return bres;
    },
    redirect: (code: number, url: string) => {
      res.redirect(code, url);
      return bres;
    },
    sendFile: (file: string, mime: string = "text/html") => {
      const stream = fs.createReadStream(file);
      res.type(mime).send(stream);
      return bres;
    },
    sendRaw: (data: Buffer, mime: string = "text/html") => {
      res.type(mime).send(data);
      return bres;
    },
    pipe: (code: number, stream: ReadableStream) => {
      res.status(code);
      res.headers(bres.headers);

      let nodeStream;
      if (stream instanceof Readable) {
        nodeStream = stream;
        // @ts-expect-error
      } else if (stream.getReader) {
        // If `stream` is a Web ReadableStream, convert it
        // @ts-expect-error
        nodeStream = Readable.fromWeb(stream);
      } else {
        throw new Error("Unsupported stream type");
      }

      // Send the stream using Fastify's response handling
      res.send(nodeStream);

      return bres;
    },
  };

  // console.log("middlewares", middlewares)

  for (var i = 0; i < middlewares.length; i++) {
    const m = middlewares[i];
    try {
      const promise = new Promise<void>(async (rres, rrej) => {
        try {
          const rr = await m(breq, bres);
          if (rr) return rrej(rr);
          else rres();
        } catch (err) {
          return rrej(err);
        }
      });
      const timeout = new Promise<void>((pres, prej) =>
        setTimeout(() => prej({ code: 408, message: "timeout" }), 1000)
      );
      const ret = await Promise.race([promise, timeout]);
      breq.middlewares.push(ret);
    } catch (merr) {
      const code = merr === "timeout" ? 408 : (merr as any)?.code || 500;
      const message =
        merr === "timeout"
          ? `Request timeout (${i + 1})`
          : (merr as any)?.message || "Request error";
      return bres.status(code).send({ message });
    }
  }

  return handler(breq, bres);
};

const methods: BMethod[] = [
  "get",
  "post",
  "patch",
  "put",
  "delete",
  "head",
  "options",
];

const draw = ({
  route,
  path = "/",
  middlewares = [],
  websockets = {},
}: {
  route: BRoute;
  path?: string;
  middlewares?: BMiddleware[];
  websockets?: { [path: string]: BRouteWebsocketHandler };
}) => {
  const mids: BMiddleware[] = [...middlewares, ...(route.middlewares || [])];
  let count = 0;
  methods.forEach((method) => {
    let handler = route[method];
    if (handler) {
      let fn: BRouteHandler;
      let mmids = mids;
      if (Array.isArray(handler)) {
        mmids = [...mids, ...handler[1]];
        fn = handler[0];
      } else {
        fn = handler;
      }

      // console.log(`Drawing: ${method.toUpperCase()} ${path} middlewares:${mids.length}`);
      app[method](path, (req: FastifyRequest, res: FastifyReply) => {
        run(fn, req, res, ...mmids).catch((err) => {
          console.error(`ERROR | ${method.toUpperCase()} ${path}`, err);
          if (err.code) {
            res.status(err.code);
          } else {
            res.status(500);
          }
          res.send({
            message: err.message || "Internal server error",
            error: err.stack,
          });
        });
      });
      count++;
    }
  });
  if (count > 0 && !route.options) {
    app.options(path, (req, res) => {
      res.headers(corsHeaders);
      res.status(200).send();
    });
  }
  if (route.websocket) {
    websockets[path] = route.websocket;
  }
  if (route.routes) {
    Object.keys(route.routes).forEach((key) => {
      const mids = [...(route.middlewares || []), ...middlewares];
      draw({
        route: route.routes![key],
        path: [path, key].join("/").replace("//", "/"),
        middlewares: mids,
        websockets,
      });
    });
  }

  return {
    count,
    websockets,
  };
};

type WSHandler = {
  handler: BRouteWebsocketHandler;
  request: BRequest;
};

export default (routes: BRoute) => {
  /* Draw the HTTP routes */
  const conf = draw({
    route: routes,
  });

  /* Draw the Websocket routes */
  let wss: WebSocketServer | undefined = undefined;
  if (conf.websockets) {
    wss = new WebSocketServer({ noServer: true });
    app.server.on("upgrade", (req, socket, head) => {
      const baseUrl = `ws://${req.headers.host}`;
      const url = new URL(req.url!, baseUrl);
      let wsHandler: WSHandler | undefined = undefined;
      for (var path in conf.websockets) {
        const params: { [key: number]: string } = {};
        const regexpPath = path
          .split("/")
          .map((p, i) => {
            if (p.startsWith(":")) {
              params[i] = p.substring(1);
              return "([^/]+)";
            }
            return p;
          })
          .join("/");
        const regexp = new RegExp("^" + regexpPath + "$");
        if (regexp.test(url.pathname!)) {
          const reqParams: { [key: string]: string } = {};
          if (Object.keys(params).length) {
            const parts = url.pathname.split("/");
            Object.keys(params).forEach((p) => {
              const index = parseInt(p);
              reqParams[params[index]] = parts[index];
            });
          }
          wsHandler = {
            handler: conf.websockets[path],
            request: {
              method: "get",
              path: req.url!,
              params: reqParams,
              query: Object.fromEntries(url.searchParams),
              body: {},
              headers: (req.headers || {}) as { [key: string]: string },
              cookies: {},
              middlewares: [],
              extras: {},
            },
          };
          continue;
        }
      }

      if (wsHandler) {
        wss!.handleUpgrade(req, socket, head, (ws) => {
          wss!.emit("connection", ws, wsHandler);
        });
      } else {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
      }
    });

    wss.on("connection", (ws, { handler, request }: WSHandler) => {
      handler(request, ws);
    });
  }

  return {
    listen: (port: number, host: string = "::") => app.listen({ host, port }),
    app,
    wss,
    stop: () => app.close(),
  } as BApp;
};
