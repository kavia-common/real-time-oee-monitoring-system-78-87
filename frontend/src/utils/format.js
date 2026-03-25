// PUBLIC_INTERFACE
export function formatPercent(value) {
  /** Formats a decimal ratio (0..1) into a percentage string. */
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

// PUBLIC_INTERFACE
export function formatSignedPercentDelta(delta) {
  /** Formats a small delta ratio into a signed percentage point string. */
  if (typeof delta !== "number" || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const abs = Math.abs(delta);
  return `${sign}${Math.round(abs * 100)}pp`;
}

// PUBLIC_INTERFACE
export function formatTimestampTime(tsMs) {
  /** Formats a timestamp into locale time (HH:MM:SS). */
  if (!tsMs) return "—";
  const d = new Date(tsMs);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
