const dotenv = require("dotenv");

dotenv.config();

function parseBool(v, fallback = false) {
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return fallback;
}

function parseNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Loads runtime configuration from environment variables.
 * (We intentionally do not read any frontend REACT_APP_* vars here.)
 */
function loadConfig() {
  const port = parseNumber(process.env.PORT, 5000);

  const corsOriginsRaw = process.env.CORS_ORIGINS || "";
  const corsOrigins = corsOriginsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    port,
    nodeEnv: process.env.NODE_ENV || "development",
    trustProxy: parseBool(process.env.TRUST_PROXY, false),
    logLevel: process.env.LOG_LEVEL || "info",
    mongodbUri: process.env.MONGODB_URI || "",
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
    corsOrigins,
    oeeAlertThreshold: parseNumber(process.env.OEE_ALERT_THRESHOLD, 0.75),
  };
}

module.exports = { loadConfig };
