const express = require("express");
const User = require("../models/User");
const { signToken, requireAuth } = require("../auth/jwt");
const { registerSchema, loginSchema } = require("../validation/schemas");

function zodErrorToResponse(e) {
  return { error: "Validation failed", details: e?.issues || [] };
}

function publicUser(u) {
  return { id: String(u._id), email: u.email, name: u.name, role: u.role };
}

function routerFactory(cfg) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      const existing = await User.findOne({ email: input.email.toLowerCase() }).lean();
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const passwordHash = await User.hashPassword(input.password);
      const user = await User.create({
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        passwordHash,
      });

      const token = signToken(publicUser(user), cfg);
      return res.status(201).json({ token, user: publicUser(user) });
    } catch (e) {
      if (e?.name === "ZodError") return res.status(400).json(zodErrorToResponse(e));
      return res.status(500).json({ error: "Failed to register user" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = await User.findOne({ email: input.email.toLowerCase() });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await user.verifyPassword(input.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken(publicUser(user), cfg);
      return res.json({ token, user: publicUser(user) });
    } catch (e) {
      if (e?.name === "ZodError") return res.status(400).json(zodErrorToResponse(e));
      return res.status(500).json({ error: "Failed to login" });
    }
  });

  router.get("/me", requireAuth(cfg), async (req, res) => {
    return res.json({ user: req.user });
  });

  return router;
}

module.exports = { routerFactory };
