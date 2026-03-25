import { io } from "socket.io-client";

function withNoTrailingSlash(url) {
  return url && url.endsWith("/") ? url.slice(0, -1) : url || "";
}

function getWsBase() {
  const ws = process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_URL || "";
  return withNoTrailingSlash(ws);
}

// PUBLIC_INTERFACE
export function connectRealtime({ token = "", lineId = "", onEvent }) {
  /** Connect to backend Socket.IO and subscribe to a line room.
   *
   * Backend:
   * - Socket.IO server at /socket.io
   * - emit `subscribe` with { lineId } to join room `line:<lineId>`
   * - events include: oee:snapshot, alert:new, run:updated, downtime:created, quality:created
   */
  const base = getWsBase();
  if (!base) throw new Error("Missing REACT_APP_WS_URL or REACT_APP_BACKEND_URL for realtime");

  const socket = io(base, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: token ? { token } : undefined,
  });

  socket.on("connect", () => {
    if (lineId) socket.emit("subscribe", { lineId });
  });

  const forward = (type) => (payload) => onEvent?.({ type, payload });

  socket.on("oee:snapshot", forward("oee:snapshot"));
  socket.on("alert:new", forward("alert:new"));
  socket.on("alert:acknowledged", forward("alert:acknowledged"));
  socket.on("run:updated", forward("run:updated"));
  socket.on("downtime:created", forward("downtime:created"));
  socket.on("quality:created", forward("quality:created"));

  socket.on("connect_error", (err) => {
    onEvent?.({ type: "connect_error", payload: { message: err?.message || "connect_error" } });
  });

  return () => {
    try {
      if (lineId) socket.emit("unsubscribe", { lineId });
      socket.close();
    } catch {
      // ignore
    }
  };
}
