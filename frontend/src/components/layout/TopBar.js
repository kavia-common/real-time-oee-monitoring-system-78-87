import React, { useMemo } from "react";

const LINES = [
  { id: "line-1", name: "Line 1 — Filling A" },
  { id: "line-2", name: "Line 2 — Packaging B" },
  { id: "line-3", name: "Line 3 — Assembly C" },
];

const RANGES = [
  { id: "15m", name: "Last 15 min" },
  { id: "1h", name: "Last hour" },
  { id: "8h", name: "Last 8 hours" },
  { id: "24h", name: "Last 24 hours" },
];

function sourceLabel(source) {
  if (source === "ws") return "WebSocket";
  if (source === "http") return "HTTP";
  return "Mock";
}

// PUBLIC_INTERFACE
export default function TopBar({
  title,
  subtitle,
  source,
  status,
  lastUpdatedAt,
  selectedLineId,
  timeRange,
  onChangeLine,
  onChangeTimeRange,
  onReconnect,
}) {
  /** Header/top bar for dashboard controls and context. */
  const isLive = status === "connected";
  const canReconnect = useMemo(() => status === "error" || status === "idle", [status]);

  return (
    <header className="topBar">
      <div className="pageTitle">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topBarRight" aria-label="Dashboard controls">
        <div className="controlGroup" aria-label="Line selection">
          <span className="controlLabel">Line</span>
          <select
            className="select"
            value={selectedLineId}
            onChange={(e) => onChangeLine?.(e.target.value)}
            aria-label="Select line"
          >
            {LINES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="controlGroup" aria-label="Time range selection">
          <span className="controlLabel">Range</span>
          <select
            className="select"
            value={timeRange}
            onChange={(e) => onChangeTimeRange?.(e.target.value)}
            aria-label="Select time range"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <span className="metaTag" aria-label="Data source">
          {sourceLabel(source)} ·{" "}
          <span className="mono">{isLive ? "connected" : status}</span>
        </span>

        <button
          className="btnSubtle"
          onClick={onReconnect}
          disabled={!canReconnect && status !== "connecting" ? false : false}
          aria-label="Reconnect to data source"
          title="Reconnect"
        >
          Reconnect
        </button>
      </div>
    </header>
  );
}
