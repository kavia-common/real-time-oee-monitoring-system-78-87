const http = require("http");
const { Server } = require("socket.io");

const { loadConfig } = require("./config/env");
const { connectMongo } = require("./db/mongoose");
const { createApp } = require("./app");
const { initSocket } = require("./realtime/socket");

async function main() {
  const cfg = loadConfig();

  const app = createApp(cfg);
  const server = http.createServer(app);

  const io = new Server(server, {
    cors:
      cfg.corsOrigins && cfg.corsOrigins.length
        ? { origin: cfg.corsOrigins, methods: ["GET", "POST"], credentials: true }
        : { origin: true, methods: ["GET", "POST"], credentials: true },
  });

  initSocket(io);

  await connectMongo(cfg.mongodbUri);

  server.listen(cfg.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on :${cfg.port} env=${cfg.nodeEnv}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[backend] fatal:", e);
  process.exit(1);
});
