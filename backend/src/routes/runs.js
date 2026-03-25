const express = require("express");
const ProductionRun = require("../models/ProductionRun");
const DowntimeEvent = require("../models/DowntimeEvent");
const QualityEvent = require("../models/QualityEvent");
const { requireAuth } = require("../auth/jwt");
const { requireRole } = require("../auth/rbac");
const { startRunSchema, stopRunSchema } = require("../validation/schemas");
const { computeOeeForRun } = require("../services/oee");
const { emitToLine } = require("../realtime/socket");
const Alert = require("../models/Alert");

function zodErrorToResponse(e) {
  return { error: "Validation failed", details: e?.issues || [] };
}

async function maybeCreateAlert({ cfg, lineId, runId, oee }) {
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

  // Operator+ can start/stop runs
  router.post("/start", requireAuth(cfg), requireRole("operator"), async (req, res) => {
    try {
      const input = startRunSchema.parse(req.body);

      const run = await ProductionRun.create({
        lineId: input.lineId,
        startedByUserId: req.user.id,
        shiftId: input.shiftId || "",
        plannedProductionTimeMinutes: input.plannedProductionTimeMinutes,
        targetRatePerMinute: input.targetRatePerMinute,
        startTime: new Date(),
        status: "running",
      });

      emitToLine(run.lineId, "run:updated", { run });
      return res.status(201).json({ run });
    } catch (e) {
      if (e?.name === "ZodError") return res.status(400).json(zodErrorToResponse(e));
      return res.status(500).json({ error: "Failed to start run" });
    }
  });

  router.post("/stop", requireAuth(cfg), requireRole("operator"), async (req, res) => {
    try {
      const input = stopRunSchema.parse(req.body);

      const run = await ProductionRun.findById(input.runId);
      if (!run) return res.status(404).json({ error: "Run not found" });

      // Only stop if running
      if (run.status !== "running") return res.status(400).json({ error: "Run already stopped" });

      run.status = "stopped";
      run.endTime = new Date();
      await run.save();

      const downtimeEvents = await DowntimeEvent.find({ runId: run._id }).lean();
      const oee = computeOeeForRun({ run, downtimeEvents });

      await maybeCreateAlert({ cfg, lineId: run.lineId, runId: run._id, oee: oee.oee });

      emitToLine(run.lineId, "run:updated", { run });
      emitToLine(run.lineId, "oee:snapshot", {
        snapshot: {
          kpis: {
            availability: oee.availability,
            performance: oee.performance,
            quality: oee.quality,
            oee: oee.oee,
          },
          context: { lineId: run.lineId, timeRange: "realtime" },
          trends: {},
        },
        events: [],
        series: [],
      });

      return res.json({ run, oee });
    } catch (e) {
      if (e?.name === "ZodError") return res.status(400).json(zodErrorToResponse(e));
      return res.status(500).json({ error: "Failed to stop run" });
    }
  });

  // Supervisor+ can list runs
  router.get("/", requireAuth(cfg), requireRole("supervisor"), async (req, res) => {
    const { lineId, status, limit = "50" } = req.query;
    const q = {};
    if (lineId) q.lineId = String(lineId);
    if (status) q.status = String(status);

    const runs = await ProductionRun.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Number(limit) || 50))
      .lean();

    return res.json({ runs });
  });

  // Operator+ can get current run for a line
  router.get("/current", requireAuth(cfg), requireRole("operator"), async (req, res) => {
    const lineId = String(req.query.lineId || "");
    if (!lineId) return res.status(400).json({ error: "lineId is required" });

    const run = await ProductionRun.findOne({ lineId, status: "running" }).sort({ startTime: -1 }).lean();
    return res.json({ run: run || null });
  });

  // Manager+ can get run details (includes downtime + quality)
  router.get("/:id", requireAuth(cfg), requireRole("manager"), async (req, res) => {
    const run = await ProductionRun.findById(req.params.id).lean();
    if (!run) return res.status(404).json({ error: "Run not found" });

    const downtime = await DowntimeEvent.find({ runId: run._id }).sort({ occurredAt: -1 }).lean();
    const quality = await QualityEvent.find({ runId: run._id }).sort({ occurredAt: -1 }).lean();

    const oee = computeOeeForRun({ run, downtimeEvents: downtime });
    return res.json({ run, downtime, quality, oee });
  });

  return router;
}

module.exports = { routerFactory };
