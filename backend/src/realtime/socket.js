let ioRef = null;

/**
 * Initializes Socket.IO server and registers event handlers.
 * @param {import("socket.io").Server} io
 */
function initSocket(io) {
  ioRef = io;

  io.on("connection", (socket) => {
    // Client can send { type:'subscribe', data:{ lineId } } (used by existing frontend wsClient too)
    socket.on("subscribe", (payload) => {
      const lineId = payload?.lineId || payload?.data?.lineId;
      if (lineId) socket.join(`line:${lineId}`);
    });

    socket.on("unsubscribe", (payload) => {
      const lineId = payload?.lineId || payload?.data?.lineId;
      if (lineId) socket.leave(`line:${lineId}`);
    });
  });
}

/**
 * Emits an event to all subscribers of a line.
 * @param {string} lineId
 * @param {string} event
 * @param {any} data
 */
function emitToLine(lineId, event, data) {
  if (!ioRef) return;
  ioRef.to(`line:${lineId}`).emit(event, data);
}

/**
 * Emits to all connected clients.
 * @param {string} event
 * @param {any} data
 */
function emitToAll(event, data) {
  if (!ioRef) return;
  ioRef.emit(event, data);
}

module.exports = { initSocket, emitToLine, emitToAll };
