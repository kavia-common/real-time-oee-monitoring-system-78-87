const mongoose = require("mongoose");

const QualityEventSchema = new mongoose.Schema(
  {
    runId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "ProductionRun", index: true },
    lineId: { type: String, required: true, index: true },
    rejectedUnits: { type: Number, required: true, min: 0 },
    defectReason: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QualityEvent", QualityEventSchema);
