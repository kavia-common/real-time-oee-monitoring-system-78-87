import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiDownload, apiRequest } from "../services/http";

function isoLocalInputValue(d) {
  // YYYY-MM-DDTHH:MM (local) for datetime-local input
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// PUBLIC_INTERFACE
export default function ManagerDashboard() {
  /** Manager: access historical run details + shift handover PDF export. */
  const { token, user } = useAuth();

  const [lineId, setLineId] = useState("line-1");
  const [status, setStatus] = useState("");
  const [runs, setRuns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [shiftStart, setShiftStart] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() - 8);
    return isoLocalInputValue(d);
  });
  const [shiftEnd, setShiftEnd] = useState(() => isoLocalInputValue(new Date()));

  async function loadRuns() {
    setBusy(true);
    setMsg("");
    const res = await apiRequest(
      `/runs?lineId=${encodeURIComponent(lineId)}${status ? `&status=${encodeURIComponent(status)}` : ""}&limit=100`,
      { token }
    );
    setBusy(false);
    if (!res.ok) return setMsg(res.json?.error || "Failed to load runs");
    setRuns(res.json?.runs || []);
  }

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, status]);

  const totals = useMemo(() => {
    let produced = 0;
    let rejects = 0;
    for (const r of runs) {
      produced += (Number(r.goodUnits) || 0) + (Number(r.rejectUnits) || 0);
      rejects += Number(r.rejectUnits) || 0;
    }
    return { produced, rejects };
  }, [runs]);

  async function downloadPdf() {
    setBusy(true);
    setMsg("");

    const start = new Date(shiftStart);
    const end = new Date(shiftEnd);

    const qs = `lineId=${encodeURIComponent(lineId)}&shiftStart=${encodeURIComponent(
      start.toISOString()
    )}&shiftEnd=${encodeURIComponent(end.toISOString())}`;

    const res = await apiDownload(`/reports/shift-handover.pdf?${qs}`, { token });
    setBusy(false);
    if (!res.ok) return setMsg("Failed to download PDF (check role: manager).");

    downloadBlob(res.blob, res.filename);
    setMsg("PDF downloaded.");
  }

  return (
    <div className="appMain">
      <div className="topBar">
        <div className="pageTitle">
          <h1>Manager</h1>
          <p>
            Logged in as <span className="mono">{user?.email}</span> · reporting + export
          </p>
        </div>

        <div className="topBarRight">
          <div className="controlGroup">
            <span className="controlLabel">Line</span>
            <select className="select" value={lineId} onChange={(e) => setLineId(e.target.value)}>
              <option value="line-1">Line 1</option>
              <option value="line-2">Line 2</option>
              <option value="line-3">Line 3</option>
            </select>
          </div>

          <div className="controlGroup">
            <span className="controlLabel">Status</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          <button className="btnSubtle" onClick={loadRuns} disabled={busy}>
            Refresh
          </button>
        </div>
      </div>

      <main className="contentGrid" style={{ gridTemplateColumns: "1fr 420px" }}>
        <section className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Runs</h2>
              <p>Run history list (manager can drill down via /runs/:id in backend)</p>
            </div>
          </div>
          <div className="cardBody cardBodyScroll">
            {msg ? (
              <div className="pill pillBlue" style={{ marginBottom: 10 }}>
                <span className="pillDot" aria-hidden="true" />
                {msg}
              </div>
            ) : null}

            {!runs.length ? (
              <div className="state stateEmpty" style={{ minHeight: 220 }}>
                <div>
                  <div className="stateTitle">No runs</div>
                  <div className="stateText">Start a run as Operator, then stop it to populate history.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {runs.map((r) => (
                  <div key={r._id} className="eventItem">
                    <div className="eventTopRow">
                      <div className="eventTitle">
                        <span className="mono">{r._id.slice(-6)}</span> · {r.status}
                      </div>
                      <div className="eventTime">
                        <span className="mono">{new Date(r.startTime).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="eventBody">
                      produced={(Number(r.goodUnits) || 0) + (Number(r.rejectUnits) || 0)} · rejects=
                      {Number(r.rejectUnits) || 0} · targetRate/min={Number(r.targetRatePerMinute) || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Shift handover PDF</h2>
              <p>Downloads backend-generated report (manager role required)</p>
            </div>
          </div>

          <div className="cardBody" style={{ display: "grid", gap: 10 }}>
            <div className="pill pillGray">
              <span className="pillDot" aria-hidden="true" />
              Runs listed: <span className="mono">{runs.length}</span> · produced{" "}
              <span className="mono">{totals.produced}</span> · rejects <span className="mono">{totals.rejects}</span>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Shift start</span>
              <input className="select" type="datetime-local" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Shift end</span>
              <input className="select" type="datetime-local" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
            </label>

            <button className="btnPrimary" onClick={downloadPdf} disabled={busy}>
              Download PDF
            </button>

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Backend route: <span className="mono">GET /api/reports/shift-handover.pdf</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="appFooter">
        <div className="footerLeft">
          <span className="footerBrand">OEE Monitor</span>
          <span className="footerSep">•</span>
          <span className="footerMuted">Manager console</span>
        </div>
        <div className="footerRight">
          <span className="footerMuted mono">{lineId}</span>
        </div>
      </footer>
    </div>
  );
}
