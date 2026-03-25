const express = require("express");
const Alert = require("../models/Alert");
const { requireAuth } = require("../auth/jwt");
const { requireRole } = require("../auth/rbac");
const { emitToLine } = require("../realtime/socket");

function routerFactory(cfg) {
  const router = express.Router();

  router.get("/", requireAuth(cfg), requireRole("supervisor"), async (req, res) => {
    const { lineId, acknowledged, limit = "100" } = req.query;
    const q = {};
    if (lineId) q.lineId = String(lineId);
    if (acknowledged === "true") q.acknowledged = true;
    if (acknowledged === "false") q.acknowledged = false;

    const alerts = await Alert.find(q)
      .sort({ createdAtTs: -1 })
      .limit(Math.min(500, Number(limit) || 100))
      .lean();

    return res.json({ alerts });
  });

  router.post("/:id/ack", requireAuth(cfg), requireRole("supervisor"), async (req, res) => {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    if (!alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedByUserId = req.user.id;
      alert.acknowledgedAt = new Date();
      await alert.save();

      emitToLine(alert.lineId, "alert:acknowledged", { alert });
    }

    return res.json({ alert });
  });

  return router;
}

module.exports = { routerFactory };
