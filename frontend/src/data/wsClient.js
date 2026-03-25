function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function isHttpsPage() {
  // In unit tests or non-browser environments, window may not exist.
  try {
    return typeof window !== "undefined" && window.location?.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeWsUrlForPageSecurity(wsUrl) {
  if (!wsUrl || typeof wsUrl !== "string") return "";
  const raw = wsUrl.trim();
  if (!raw) return "";

  // If the app is served via HTTPS, browsers will block insecure `ws://` as mixed content.
  // Auto-upgrade to `wss://` to avoid frontend runtime errors in HTTPS previews.
  if (isHttpsPage() && raw.startsWith("ws://")) {
    return `wss://${raw.slice("ws://".length)}`;
  }

  return raw;
}

// PUBLIC_INTERFACE
export function connectOeeWebSocket({
  wsUrl,
  lineId,
  timeRange,
  onOpen,
  onClose,
  onError,
  onMessage,
}) {
  /** Connects to the optional backend WebSocket for OEE streaming.
   *
   * Security behavior:
   * - If the page is loaded over HTTPS and wsUrl starts with `ws://`, the client
   *   automatically upgrades it to `wss://` to avoid mixed-content blocking.
   *
   * The backend message schema is not fixed; this client accepts either:
   * - raw snapshot-like payloads, or
   * - { type, data } envelopes.
   *
   * Params:
   *  - wsUrl: REACT_APP_WS_URL
   *  - lineId, timeRange: subscription context
   *  - callbacks for lifecycle and messages
   *
   * Returns:
   *  - cleanup() function to close the socket.
   */
  const finalWsUrl = normalizeWsUrlForPageSecurity(wsUrl);

  if (!finalWsUrl) {
    throw new Error("WS URL not provided");
  }

  // Extra guard: if still insecure on HTTPS page (e.g., wsUrl is protocol-relative/odd),
  // fail fast so callers can gracefully fall back to mock/HTTP.
  if (isHttpsPage() && finalWsUrl.startsWith("ws://")) {
    throw new Error("Blocked insecure ws:// WebSocket on an HTTPS page");
  }

  let socket;
  try {
    socket = new WebSocket(finalWsUrl);
  } catch (e) {
    // e.g., malformed URL
    throw e instanceof Error ? e : new Error("Failed to construct WebSocket");
  }

  socket.addEventListener("open", () => {
    // Optional subscribe message; backend may ignore safely.
    try {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          data: { lineId, range: timeRange, timeRange },
        })
      );
    } catch {
      // ignore
    }
    onOpen?.();
  });

  socket.addEventListener("message", (evt) => {
    const payload =
      typeof evt.data === "string" ? safeParseJson(evt.data) ?? evt.data : evt.data;
    onMessage?.(payload);
  });

  socket.addEventListener("error", () => {
    onError?.(new Error("WebSocket connection error"));
  });

  socket.addEventListener("close", () => {
    onClose?.();
  });

  return () => {
    try {
      socket.close();
    } catch {
      // ignore
    }
  };
}
