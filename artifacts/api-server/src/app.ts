import express, { type Express, type ErrorRequestHandler } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "128kb" }));

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // Never log request bodies, DB error details, passwords, or applicant information.
  req.log.error({ category: error?.name ?? "Error" }, "Request failed");
  if (res.headersSent) return;
  const status = error?.type === "entity.too.large" ? 413 : error?.type === "entity.parse.failed" ? 400 : 503;
  res.status(status).json({ error: status === 503 ? "تعذر إتمام العملية حالياً. يرجى المحاولة لاحقاً" : "الطلب غير صالح" });
};
app.use(errorHandler);

export default app;
