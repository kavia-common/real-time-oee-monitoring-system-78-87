const express = require("express");
const ProductionRun = require("../models/ProductionRun");
const QualityEvent = require("../models/QualityEvent");
const DowntimeEvent = require("../models/DowntimeEvent");
const { requireAuth } = require("../auth/jwt");
const { requireRole } = require("../auth/rbac");
const { qualityCreateSchema } = require("../validation/schemas");
const { computeOeeForRun } = require("../services/oee");
const { emitToLine } = require("../realtime/socket");
const Alert = require("../models/Alert");

function zodErrorToResponse(e) {
  return { error: "Validation failed", details: e?.issues || [] };
}

async function createAlertIfNeeded({ cfg, lineId, runId, oee }) {
  if (oee >= cfg.oeeAlertThreshold) return null;

  const alert = await Alert.create({
    lineId,
    runId,
    severity: oee < cfg.oeeAlertThreshold * 0.9 ? "critical" : "warning",
    message: `OEE dropped below ${Math.round(cfg.oeeAlertThreshold * 100)}%`,
    oee,
    threshold: cfg.oeeAlertThreshold,
    createdAtTs: new Date(),
  });

  emitToLine(lineId, "alert:new", { alert });
  return alert;
}

function routerFactory(cfg) {
  const router = express.Router();

  router.post("/", requireAuth(cfg), requireRole("operator"), async (req, res) => {
    try {
      const input = qualityCreateSchema.parse(req.body);
      const run = await ProductionRun.findById(input.runId);
      if (!run) return res.status(404).json({ error: "Run not found" });

      const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

      const qEvt = await QualityEvent.create({
        runId: run._id,
        lineId: run.lineId,
        rejectedUnits: input.rejectedUnits,
        defectReason: input.defectReason,
        occurredAt,
        createdByUserId: req.user.id,
      });

      // Update run counters
      run.rejectUnits = (Number(run.rejectUnits) || 0) + input.rejectedUnits;
      await run.save();

      const downtimeEvents = await DowntimeEvent.find({ runId: run._id }).lean();
      const oee = computeOeeForRun({ run, downtimeEvents });

      await createAlertIfNeeded({ cfg, lineId: run.lineId, runId: run._id, oee: oee.oee });

      emitToLine(run.lineId, "quality:created", { quality: qEvt });
      emitToLine(run.lineId, "run:updated", { run });
      emitToLine(run.lineId, "oee:snapshot", {
        snapshot: {
          kpis: {
            availability: oee.availability,
            performance: oee.performance,
            quality: oee.quality,
            oee: oee.oee,
          },
          trends: {},
          context: { lineId: run.lineId, timeRange: "realtime" },
        },
        events: [],
        series: [],
      });

      return res.status(201).json({ quality: qEvt, run, oee });
    } catch (e) {
      if (e?.name === "ZodError") return res.status(400).json(zodErrorToResponse(e));
      return res.status(500).json({ error: "Failed to create quality event" });
    }
  });

  // Supervisor+ can list quality by run or line
  router.get("/", requireAuth(cfg), requireRole("supervisor"), async (req, res) => {
    const { runId, lineId, limit = "100" } = req.query;
    const q = {};
    if (runId) q.runId = String(runId);
    if (lineId) q.lineId = String(lineId);

    const quality = await QualityEvent.find(q)
      .sort({ occurredAt: -1 })
      .limit(Math.min(500, Number(limit) || 100))
      .lean();

    return res.json({ quality });
  });

  return router;
}

module.exports = { routerFactory };
