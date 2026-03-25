import React from "react";
import { formatSignedPercentDelta } from "../../utils/format";

function colorToPillClass(color) {
  if (color === "amber") return "pillAmber";
  return "pillBlue";
}

// PUBLIC_INTERFACE
export default function KpiCard({
  loading = false,
  title = "",
  value = null,
  valueLabel = "—",
  hint = "",
  color = "blue",
  emphasized = false,
  trend = null,
}) {
  /** KPI card for Availability/Performance/Quality/OEE. */
  if (loading) {
    return (
      <div className={`card kpiCard ${emphasized ? "kpiEmphasis" : ""}`}>
        <div className="kpiTop">
          <div>
            <div className="kpiTitle" style={{ opacity: 0.6 }}>
              Loading…
            </div>
            <div className="kpiHint">Fetching KPI</div>
          </div>
          <span className={`pill ${colorToPillClass(color)}`}>
            <span className="pillDot" aria-hidden="true" />
            —
          </span>
        </div>
        <div className="kpiValueRow">
          <div className="kpiValue" style={{ opacity: 0.35 }}>
            ——
          </div>
          <div className="kpiDelta">—</div>
        </div>
      </div>
    );
  }

  const delta = typeof trend === "number" ? trend : null;
  const deltaLabel = delta === null ? "—" : formatSignedPercentDelta(delta);

  // Simple severity cues based on value
  const pillTone =
    typeof value === "number"
      ? value < 0.6
        ? "pillRed"
        : value < 0.72
          ? "pillAmber"
          : "pillGreen"
      : "pillGray";

  return (
    <div className={`card kpiCard ${emphasized ? "kpiEmphasis" : ""}`}>
      <div className="kpiTop">
        <div>
          <div className="kpiTitle">{title}</div>
          <div className="kpiHint">{hint}</div>
        </div>
        <span className={`pill ${pillTone}`} aria-label={`${title} status`}>
          <span className="pillDot" aria-hidden="true" />
          {valueLabel}
        </span>
      </div>

      <div className="kpiValueRow">
        <div className="kpiValue" aria-label={`${title} value`}>
          {valueLabel}
        </div>
        <div className="kpiDelta" aria-label={`${title} delta`}>
          {deltaLabel}
        </div>
      </div>
    </div>
  );
}
