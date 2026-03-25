const { loadConfig } = require("../config/env");
const { connectMongo } = require("../db/mongoose");
const User = require("../models/User");

/**
 * Simple seed utility to create 3 sample users (one per role).
 * Run manually if desired:
 *   node src/scripts/seed.js
 */
async function run() {
  const cfg = loadConfig();
  await connectMongo(cfg.mongodbUri);

  const users = [
    { email: "operator@example.com", name: "Operator One", role: "operator", password: "operator123" },
    { email: "supervisor@example.com", name: "Supervisor One", role: "supervisor", password: "supervisor123" },
    { email: "manager@example.com", name: "Manager One", role: "manager", password: "manager123" },
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    if (existing) continue;
    const passwordHash = await User.hashPassword(u.password);
    await User.create({ email: u.email.toLowerCase(), name: u.name, role: u.role, passwordHash });
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  process.exit(0);
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", e);
  process.exit(1);
});
