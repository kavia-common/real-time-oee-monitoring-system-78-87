const mongoose = require("mongoose");

const DowntimeEventSchema = new mongoose.Schema(
  {
    runId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "ProductionRun", index: true },
    lineId: { type: String, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      required: true,
      enum: ["breakdown", "changeover", "material_wait", "planned_stop"],
    },
    note: { type: String, default: "", trim: true },
    occurredAt: { type: Date, required: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DowntimeEvent", DowntimeEventSchema);
