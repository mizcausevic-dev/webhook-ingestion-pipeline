import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import healthRouter from "./routes/health.js";
import webhookRouter from "./routes/webhooks.js";
import eventsRouter from "./routes/events.js";
import failuresRouter from "./routes/failures.js";
import metricsRouter from "./routes/metrics.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const docsPath = path.join(process.cwd(), "docs", "openapi.yaml");
const openApiDocument = yaml.load(
  fs.readFileSync(docsPath, "utf8"),
) as Parameters<typeof swaggerUi.setup>[0];

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/health", healthRouter);
app.use("/webhooks", webhookRouter);
app.use("/api/events", eventsRouter);
app.use("/api/failures", failuresRouter);
app.use("/api/metrics", metricsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
