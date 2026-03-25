function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
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
  if (!wsUrl) {
    throw new Error("WS URL not provided");
  }

  const socket = new WebSocket(wsUrl);

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
