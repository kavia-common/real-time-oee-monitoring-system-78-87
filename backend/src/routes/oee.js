const express = require("express");
const ProductionRun = require("../models/ProductionRun");
const DowntimeEvent = require("../models/DowntimeEvent");
const { requireAuth } = require("../auth/jwt");
const { requireRole } = require("../auth/rbac");
const { computeOeeForRun } = require("../services/oee");

/**
 * Returns a snapshot payload compatible with frontend normalizeIncoming():
 * { snapshot, series, events }
 */
function routerFactory(cfg) {
  const router = express.Router();

  router.get("/realtime", requireAuth(cfg), requireRole("operator"), async (req, res) => {
    const lineId = String(req.query.lineId || "");
    if (!lineId) return res.status(400).json({ error: "lineId is required" });

    const run = await ProductionRun.findOne({ lineId, status: "running" }).sort({ startTime: -1 });
    if (!run) {
      return res.json({
        snapshot: {
          kpis: { availability: 1, performance: 1, quality: 1, oee: 1 },
          trends: {},
          context: { lineId, timeRange: "realtime" },
        },
        series: [],
        events: [],
      });
    }

    const downtimeEvents = await DowntimeEvent.find({ runId: run._id }).lean();
    const oee = computeOeeForRun({ run, downtimeEvents });

    return res.json({
      snapshot: {
        kpis: {
          availability: oee.availability,
          performance: oee.performance,
          quality: oee.quality,
          oee: oee.oee,
        },
        trends: {},
        context: { lineId, timeRange: "realtime" },
      },
      series: [],
      events: [],
    });
  });

  return router;
}

module.exports = { routerFactory };
