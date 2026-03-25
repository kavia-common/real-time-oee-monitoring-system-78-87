import React from "react";

function mapStatus(status) {
  switch (status) {
    case "connected":
      return { cls: "pillGreen", dot: true };
    case "connecting":
      return { cls: "pillBlue", dot: true };
    case "error":
    case "critical":
      return { cls: "pillRed", dot: true };
    case "warning":
      return { cls: "pillAmber", dot: true };
    case "info":
      return { cls: "pillBlue", dot: true };
    default:
      return { cls: "pillGray", dot: true };
  }
}

// PUBLIC_INTERFACE
export default function StatusPill({ status, label }) {
  /** Small labeled status pill. */
  const m = mapStatus(status);
  return (
    <span className={`pill ${m.cls}`} aria-label={label ?? status}>
      {m.dot ? <span className="pillDot" aria-hidden="true" /> : null}
      {label ?? status}
    </span>
  );
}
