const mongoose = require("mongoose");

const ProductionRunSchema = new mongoose.Schema(
  {
    lineId: { type: String, required: true, index: true },
    startedByUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },

    shiftId: { type: String, default: "" },

    plannedProductionTimeMinutes: { type: Number, required: true, min: 1 },
    targetRatePerMinute: { type: Number, required: true, min: 0 },

    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },

    // Counters (updated by events)
    goodUnits: { type: Number, default: 0, min: 0 },
    rejectUnits: { type: Number, default: 0, min: 0 },

    status: { type: String, required: true, enum: ["running", "stopped"], index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductionRun", ProductionRunSchema);
