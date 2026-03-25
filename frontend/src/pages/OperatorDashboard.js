import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../services/http";
import { connectRealtime } from "../services/realtime";
import KpiCard from "../components/kpi/KpiCard";
import TrendChart from "../components/charts/TrendChart";
import NotificationsPanel from "../components/notifications/NotificationsPanel";
import { formatPercent } from "../utils/format";
import { uid } from "../utils/uid";

function emptySnapshot(lineId) {
  return {
    kpis: { availability: 1, performance: 1, quality: 1, oee: 1 },
    trends: {},
    context: { lineId, timeRange: "realtime" },
  };
}

function mapAlertToEvent(alert) {
  return {
    id: String(alert?._id || uid("evt")),
    ts: alert?.createdAtTs ? new Date(alert.createdAtTs).getTime() : Date.now(),
    severity: alert?.severity || "warning",
    title: "OEE Alert",
    message: alert?.message || "Alert triggered",
    meta: { lineId: alert?.lineId || "line", category: "Alert", code: "OEE" },
  };
}

// PUBLIC_INTERFACE
export default function OperatorDashboard() {
  /** Operator: start/stop run, log downtime & quality, view realtime KPIs. */
  const { token, user } = useAuth();

  const [lineId, setLineId] = useState("line-1");
  const [snapshot, setSnapshot] = useState(() => emptySnapshot(lineId));
  const [series, setSeries] = useState([]);
  const [events, setEvents] = useState([]);

  const [currentRun, setCurrentRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Start run form
  const [plannedMinutes, setPlannedMinutes] = useState(480);
  const [targetRate, setTargetRate] = useState(10);

  // Downtime form
  const [dtMinutes, setDtMinutes] = useState(5);
  const [dtReason, setDtReason] = useState("breakdown");
  const [dtNote, setDtNote] = useState("");

  // Quality form
  const [rejectUnits, setRejectUnits] = useState(1);
  const [defectReason, setDefectReason] = useState("Defect");

  const kpis = useMemo(() => {
    const s = snapshot?.kpis;
    if (!s) return [];
    return [
      { key: "availability", title: "Availability", value: s.availability, hint: "Uptime vs planned" },
      { key: "performance", title: "Performance", value: s.performance, hint: "Speed vs ideal" },
      { key: "quality", title: "Quality", value: s.quality, hint: "Good vs total" },
      { key: "oee", title: "OEE", value: s.oee, hint: "A×P×Q", emphasized: true },
    ];
  }, [snapshot]);

  async function loadCurrentRun() {
    const res = await apiRequest(`/runs/current?lineId=${encodeURIComponent(lineId)}`, { token });
    if (res.ok) setCurrentRun(res.json?.run || null);
  }

  async function loadSnapshotOnce() {
    const res = await apiRequest(`/oee/realtime?lineId=${encodeURIComponent(lineId)}`, { token });
    if (res.ok) {
      setSnapshot(res.json?.snapshot || emptySnapshot(lineId));
      setSeries(res.json?.series || []);
      setEvents(res.json?.events || []);
    }
  }

  useEffect(() => {
    // When line changes: load current run + snapshot
    loadCurrentRun();
    loadSnapshotOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId]);

  useEffect(() => {
    // Realtime subscription
    if (!token) return () => {};

    const stop = connectRealtime({
      token,
      lineId,
      onEvent: ({ type, payload }) => {
        if (type === "oee:snapshot") {
          setSnapshot(payload?.snapshot || emptySnapshot(lineId));
          if (Array.isArray(payload?.series)) setSeries(payload.series);
          if (Array.isArray(payload?.events)) setEvents(payload.events);
        } else if (type === "alert:new") {
          const ev = mapAlertToEvent(payload?.alert);
          setEvents((prev) => [ev, ...(prev || [])].slice(0, 20));
        } else if (type === "run:updated") {
          // Keep current run in sync if it matches our line
          if (payload?.run?.lineId === lineId) setCurrentRun(payload.run);
        }
      },
    });

    return stop;
  }, [lineId, token]);

  async function startRun() {
    setBusy(true);
    setMessage("");
    const res = await apiRequest("/runs/start", {
      method: "POST",
      token,
      body: { lineId, plannedProductionTimeMinutes: Number(plannedMinutes), targetRatePerMinute: Number(targetRate) },
    });
    setBusy(false);
    if (!res.ok) return setMessage(res.json?.error || "Failed to start run");
    setCurrentRun(res.json?.run || null);
    setMessage("Run started.");
  }

  async function stopRun() {
    if (!currentRun?._id) return;
    setBusy(true);
    setMessage("");
    const res = await apiRequest("/runs/stop", {
      method: "POST",
      token,
      body: { runId: String(currentRun._id) },
    });
    setBusy(false);
    if (!res.ok) return setMessage(res.json?.error || "Failed to stop run");
    setCurrentRun(res.json?.run || null);
    setMessage("Run stopped.");
  }

  async function logDowntime() {
    if (!currentRun?._id) return setMessage("No running job. Start a run first.");
    setBusy(true);
    setMessage("");
    const res = await apiRequest("/downtime", {
      method: "POST",
      token,
      body: {
        runId: String(currentRun._id),
        durationMinutes: Number(dtMinutes),
        reason: dtReason,
        note: dtNote,
        occurredAt: new Date().toISOString(),
      },
    });
    setBusy(false);
    if (!res.ok) return setMessage(res.json?.error || "Failed to log downtime");
    setMessage("Downtime logged.");
  }

  async function logQuality() {
    if (!currentRun?._id) return setMessage("No running job. Start a run first.");
    setBusy(true);
    setMessage("");
    const res = await apiRequest("/quality", {
      method: "POST",
      token,
      body: {
        runId: String(currentRun._id),
        rejectedUnits: Number(rejectUnits),
        defectReason,
        occurredAt: new Date().toISOString(),
      },
    });
    setBusy(false);
    if (!res.ok) return setMessage(res.json?.error || "Failed to log quality event");
    setMessage("Quality event logged.");
  }

  return (
    <div className="appMain">
      <div className="topBar">
        <div className="pageTitle">
          <h1>Operator</h1>
          <p>
            Logged in as <span className="mono">{user?.email}</span> · line control + event logging
          </p>
        </div>

        <div className="topBarRight">
          <div className="controlGroup" aria-label="Line selection">
            <span className="controlLabel">Line</span>
            <select className="select" value={lineId} onChange={(e) => setLineId(e.target.value)}>
              <option value="line-1">Line 1</option>
              <option value="line-2">Line 2</option>
              <option value="line-3">Line 3</option>
            </select>
          </div>

          <span className="metaTag">
            Run: <span className="mono">{currentRun?.status === "running" ? "running" : "none"}</span>
          </span>
        </div>
      </div>

      <main className="contentGrid">
        <section className="kpiGrid">
          {kpis.map((k) => (
            <KpiCard
              key={k.key}
              title={k.title}
              value={k.value}
              valueLabel={formatPercent(k.value)}
              hint={k.hint}
              emphasized={k.emphasized}
              trend={snapshot?.trends?.[k.key] ?? null}
            />
          ))}
        </section>

        <section className="card chartCard">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Realtime OEE</h2>
              <p>{lineId.toUpperCase()} · from Socket.IO + REST snapshot</p>
            </div>
          </div>
          <div className="cardBody">
            <TrendChart series={series} ariaLabel="Realtime OEE chart" />
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Run controls</h2>
              <p>Start/stop production runs for the selected line</p>
            </div>
          </div>

          <div className="cardBody">
            {message ? (
              <div className="pill pillBlue" style={{ marginBottom: 10 }}>
                <span className="pillDot" aria-hidden="true" />
                {message}
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="controlLabel">Planned minutes</span>
                  <input className="select" value={plannedMinutes} onChange={(e) => setPlannedMinutes(e.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="controlLabel">Target rate / min</span>
                  <input className="select" value={targetRate} onChange={(e) => setTargetRate(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btnPrimary" onClick={startRun} disabled={busy || currentRun?.status === "running"}>
                  Start run
                </button>
                <button className="btnSubtle" onClick={stopRun} disabled={busy || currentRun?.status !== "running"}>
                  Stop run
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Log downtime</h2>
              <p>Operator logging (creates events + may trigger alerts)</p>
            </div>
          </div>
          <div className="cardBody" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="controlLabel">Duration (minutes)</span>
                <input className="select" value={dtMinutes} onChange={(e) => setDtMinutes(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="controlLabel">Reason</span>
                <select className="select" value={dtReason} onChange={(e) => setDtReason(e.target.value)}>
                  <option value="breakdown">Breakdown</option>
                  <option value="changeover">Changeover</option>
                  <option value="material_wait">Material wait</option>
                  <option value="planned_stop">Planned stop</option>
                </select>
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Note</span>
              <input className="select" value={dtNote} onChange={(e) => setDtNote(e.target.value)} />
            </label>

            <button className="btnPrimary" onClick={logDowntime} disabled={busy}>
              Log downtime
            </button>
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Log quality reject</h2>
              <p>Track rejects and defect reasons during the current run</p>
            </div>
          </div>
          <div className="cardBody" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="controlLabel">Rejected units</span>
                <input className="select" value={rejectUnits} onChange={(e) => setRejectUnits(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="controlLabel">Defect reason</span>
                <input className="select" value={defectReason} onChange={(e) => setDefectReason(e.target.value)} />
              </label>
            </div>

            <button className="btnPrimary" onClick={logQuality} disabled={busy}>
              Log quality event
            </button>
          </div>
        </section>

        <section className="card eventsCard">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Realtime events</h2>
              <p>Alerts and operational events</p>
            </div>
          </div>
          <div className="cardBody cardBodyScroll">
            <NotificationsPanel events={events} />
          </div>
        </section>
      </main>

      <footer className="appFooter">
        <div className="footerLeft">
          <span className="footerBrand">OEE Monitor</span>
          <span className="footerSep">•</span>
          <span className="footerMuted">Operator console</span>
        </div>
        <div className="footerRight">
          <span className="footerMuted mono">{lineId}</span>
        </div>
      </footer>
    </div>
  );
}
