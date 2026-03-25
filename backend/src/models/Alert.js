const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    lineId: { type: String, required: true, index: true },
    runId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductionRun", default: null, index: true },
    severity: { type: String, required: true, enum: ["warning", "critical"], default: "warning" },
    message: { type: String, required: true },
    oee: { type: Number, required: true, min: 0, max: 1 },
    threshold: { type: Number, required: true, min: 0, max: 1 },
    createdAtTs: { type: Date, required: true },
    acknowledged: { type: Boolean, default: false },
    acknowledgedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
