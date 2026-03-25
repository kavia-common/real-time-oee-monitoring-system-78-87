const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { routerFactory: authRouterFactory } = require("./routes/auth");
const { routerFactory: runsRouterFactory } = require("./routes/runs");
const { routerFactory: downtimeRouterFactory } = require("./routes/downtime");
const { routerFactory: qualityRouterFactory } = require("./routes/quality");
const { routerFactory: alertsRouterFactory } = require("./routes/alerts");
const { routerFactory: oeeRouterFactory } = require("./routes/oee");
const { routerFactory: reportsRouterFactory } = require("./routes/reports");

/**
 * Creates the Express application.
 * @param {ReturnType<import("./config/env").loadConfig>} cfg
 */
function createApp(cfg) {
  const app = express();

  if (cfg.trustProxy) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // CORS: allow configured origins; if not set, allow all in dev for convenience.
  const corsOptions =
    cfg.corsOrigins && cfg.corsOrigins.length
      ? { origin: cfg.corsOrigins, credentials: true }
      : cfg.nodeEnv === "development"
        ? { origin: true, credentials: true }
        : { origin: false };

  app.use(cors(corsOptions));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );

  app.use(morgan("tiny"));

  app.get("/health", (req, res) => res.json({ ok: true, service: "backend", ts: Date.now() }));

  app.use("/api/auth", authRouterFactory(cfg));
  app.use("/api/runs", runsRouterFactory(cfg));
  app.use("/api/downtime", downtimeRouterFactory(cfg));
  app.use("/api/quality", qualityRouterFactory(cfg));
  app.use("/api/alerts", alertsRouterFactory(cfg));
  app.use("/api/oee", oeeRouterFactory(cfg));
  app.use("/api/reports", reportsRouterFactory(cfg));

  // 404
  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
