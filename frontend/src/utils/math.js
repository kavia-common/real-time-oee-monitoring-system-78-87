// PUBLIC_INTERFACE
export function clamp01(x) {
  /** Clamps value to [0, 1]. */
  if (typeof x !== "number" || Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
