// PUBLIC_INTERFACE
export function uid(prefix = "id") {
  /** Generates a reasonably unique id for UI lists (not cryptographically secure). */
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
