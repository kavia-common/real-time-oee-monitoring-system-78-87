import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMockOeeEngine } from "./mockOeeEngine";
import { buildApiUrls, safeJsonFetch } from "./apiClient";
import { connectOeeWebSocket } from "./wsClient";

/**
 * @typedef {"idle"|"connecting"|"connected"|"error"} ConnectionStatus
 */

/**
 * @typedef {Object} OeeSnapshot
 * @property {{availability:number, performance:number, quality:number, oee:number}} kpis
 * @property {{availability?:number, performance?:number, quality?:number, oee?:number}} trends
 * @property {{lineId:string, timeRange:string}} context
 */

/**
 * @typedef {Object} OeePoint
 * @property {number} t - timestamp ms
 * @property {number} oee
 * @property {number} availability
 * @property {number} performance
 * @property {number} quality
 */

/**
 * @typedef {Object} OeeEvent
 * @property {string} id
 * @property {number} ts - timestamp ms
 * @property {"info"|"warning"|"critical"} severity
 * @property {string} title
 * @property {string} message
 * @property {{lineId:string, code?:string, category?:string}} meta
 */

/**
 * @typedef {Object} UseOeeStreamResult
 * @property {ConnectionStatus} status
 * @property {"mock"|"ws"|"http"} source
 * @property {OeeSnapshot|null} snapshot
 * @property {OeePoint[]} series
 * @property {OeeEvent[]} events
 * @property {number|null} lastUpdatedAt
 * @property {Error|null} error
 * @property {() => void} reconnect
 */

function getEnv() {
  const wsUrl = process.env.REACT_APP_WS_URL;
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  return {
    wsUrl: wsUrl && wsUrl.trim() ? wsUrl.trim() : "",
    apiBase: apiBase && apiBase.trim() ? apiBase.trim() : "",
  };
}

function normalizeIncoming(payload) {
  // Support both direct snapshot payloads and messages like {type, data}
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  const snapshot = data?.snapshot ?? data?.oeeSnapshot ?? null;
  const series = data?.series ?? data?.points ?? null;
  const events = data?.events ?? data?.notifications ?? null;

  return { snapshot, series, events };
}

// PUBLIC_INTERFACE
export function useOeeStream({ lineId, timeRange }) {
  /** React hook to subscribe to OEE data with resilient fallback.
   *
   * Behavior:
   * - If REACT_APP_WS_URL is set, attempt WebSocket connection for live stream.
   * - Else if REACT_APP_API_BASE or REACT_APP_BACKEND_URL is set, attempt HTTP polling.
   * - Otherwise (default), use a mock real-time generator.
   * - On any failure, fall back to mock generation automatically.
   *
   * Params:
   *  - lineId: selected production line identifier.
   *  - timeRange: chart time window.
   *
   * Returns:
   *  - status, source, snapshot, series, events, lastUpdatedAt, error, reconnect()
   */
  const { wsUrl, apiBase } = useMemo(getEnv, []);
  const [status, setStatus] = useState("connecting");
  const [source, setSource] = useState("mock");

  const [snapshot, setSnapshot] = useState(null);
  const [series, setSeries] = useState([]);
  const [events, setEvents] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [error, setError] = useState(null);

  const engineRef = useRef(null);
  const cleanupRef = useRef(() => {});
  const reconnectSeq = useRef(0);

  const applyUpdate = useCallback((update) => {
    if (!update) return;
    if (update.snapshot) setSnapshot(update.snapshot);
    if (Array.isArray(update.series)) setSeries(update.series);
    if (Array.isArray(update.events)) setEvents(update.events);
    const now = Date.now();
    setLastUpdatedAt(now);
    setError(null);
  }, []);

  const startMock = useCallback(() => {
    setSource("mock");
    setStatus("connected");
    setError(null);

    if (!engineRef.current) {
      engineRef.current = createMockOeeEngine();
    }

    // Seed immediately
    const seeded = engineRef.current.getState({ lineId, timeRange });
    setSnapshot(seeded.snapshot);
    setSeries(seeded.series);
    setEvents(seeded.events);
    setLastUpdatedAt(Date.now());

    const stop = engineRef.current.start({
      lineId,
      timeRange,
      onTick: (state) => {
        setSnapshot(state.snapshot);
        setSeries(state.series);
        setEvents(state.events);
        setLastUpdatedAt(Date.now());
      },
    });

    cleanupRef.current = stop;
  }, [lineId, timeRange]);

  const startWs = useCallback(() => {
    setSource("ws");
    setStatus("connecting");
    setError(null);

    const stop = connectOeeWebSocket({
      wsUrl,
      lineId,
      timeRange,
      onOpen: () => setStatus("connected"),
      onClose: () => {
        // If WS closes unexpectedly, switch to mock to keep dashboard alive.
        setStatus("error");
        setError(new Error("WebSocket disconnected; falling back to mock."));
        startMock();
      },
      onError: (err) => {
        setStatus("error");
        setError(err instanceof Error ? err : new Error("WebSocket error"));
        startMock();
      },
      onMessage: (payload) => {
        const { snapshot: s, series: pts, events: ev } = normalizeIncoming(payload);
        applyUpdate({ snapshot: s, series: pts, events: ev });
      },
    });

    cleanupRef.current = stop;
  }, [applyUpdate, lineId, startMock, timeRange, wsUrl]);

  const startHttp = useCallback(() => {
    setSource("http");
    setStatus("connecting");
    setError(null);

    const { baseUrl } = buildApiUrls(apiBase);

    let cancelled = false;

    async function fetchOnce() {
      try {
        // Convention: backend may expose /oee/realtime or /oee
        const data =
          (await safeJsonFetch(`${baseUrl}/oee/realtime?lineId=${encodeURIComponent(lineId)}&range=${encodeURIComponent(timeRange)}`)) ??
          (await safeJsonFetch(`${baseUrl}/oee?lineId=${encodeURIComponent(lineId)}&range=${encodeURIComponent(timeRange)}`));

        if (cancelled) return;

        const { snapshot: s, series: pts, events: ev } = normalizeIncoming(data);
        if (s || pts || ev) {
          setStatus("connected");
          applyUpdate({ snapshot: s, series: pts, events: ev });
        } else {
          throw new Error("Unexpected HTTP response format");
        }
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e : new Error("HTTP error"));
        // Fallback to mock (keeps UI alive)
        startMock();
      }
    }

    fetchOnce();
    const interval = setInterval(fetchOnce, 4000);

    cleanupRef.current = () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiBase, applyUpdate, lineId, startMock, timeRange]);

  const reconnect = useCallback(() => {
    reconnectSeq.current += 1;
    // Trigger effect by setting state via seq (we'll just change status; effect depends on inputs too)
    setStatus("connecting");
    setError(null);
  }, []);

  useEffect(() => {
    // Clean up any previous stream
    try {
      cleanupRef.current?.();
    } catch {
      // ignore cleanup errors
    }
    cleanupRef.current = () => {};

    setStatus("connecting");
    setError(null);

    // Prefer WS > HTTP > Mock
    if (wsUrl) {
      startWs();
    } else if (apiBase) {
      startHttp();
    } else {
      startMock();
    }

    return () => {
      try {
        cleanupRef.current?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, timeRange, wsUrl, apiBase, startWs, startHttp, startMock, reconnectSeq.current]);

  return {
    status,
    source,
    snapshot,
    series,
    events,
    lastUpdatedAt,
    error,
    reconnect,
  };
}
