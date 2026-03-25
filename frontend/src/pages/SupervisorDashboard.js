import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../services/http";
import StatusPill from "../components/common/StatusPill";

function severityToStatus(sev) {
  if (sev === "critical") return "critical";
  if (sev === "warning") return "warning";
  return "info";
}

// PUBLIC_INTERFACE
export default function SupervisorDashboard() {
  /** Supervisor: view/acknowledge alerts; review downtime/quality logs (via list endpoints). */
  const { token, user } = useAuth();
  const [lineId, setLineId] = useState("line-1");
  const [ackFilter, setAckFilter] = useState("false");
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [downtime, setDowntime] = useState([]);
  const [quality, setQuality] = useState([]);

  async function load() {
    setBusy(true);
    setMsg("");
    const a = await apiRequest(
      `/alerts?lineId=${encodeURIComponent(lineId)}&acknowledged=${encodeURIComponent(ackFilter)}&limit=200`,
      { token }
    );
    const d = await apiRequest(`/downtime?lineId=${encodeURIComponent(lineId)}&limit=200`, { token });
    const q = await apiRequest(`/quality?lineId=${encodeURIComponent(lineId)}&limit=200`, { token });

    setBusy(false);

    if (a.ok) setAlerts(a.json?.alerts || []);
    if (d.ok) setDowntime(d.json?.downtime || []);
    if (q.ok) setQuality(q.json?.quality || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, ackFilter]);

  async function ack(id) {
    setBusy(true);
    setMsg("");
    const res = await apiRequest(`/alerts/${encodeURIComponent(id)}/ack`, { method: "POST", token });
    setBusy(false);
    if (!res.ok) return setMsg(res.json?.error || "Failed to acknowledge alert");
    setMsg("Alert acknowledged.");
    load();
  }

  const openAlertsCount = useMemo(() => alerts.filter((a) => !a.acknowledged).length, [alerts]);

  return (
    <div className="appMain">
      <div className="topBar">
        <div className="pageTitle">
          <h1>Supervisor</h1>
          <p>
            Logged in as <span className="mono">{user?.email}</span> · alerts + log review
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
            <span className="controlLabel">Acknowledged</span>
            <select className="select" value={ackFilter} onChange={(e) => setAckFilter(e.target.value)}>
              <option value="false">Open</option>
              <option value="true">Acked</option>
            </select>
          </div>

          <span className="metaTag">
            Open alerts: <span className="mono">{openAlertsCount}</span>
          </span>
        </div>
      </div>

      <main className="contentGrid">
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Alerts</h2>
              <p>Supervisor can list + acknowledge alerts</p>
            </div>
            <div className="cardHeaderMeta">
              <button className="btnSubtle" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>

          <div className="cardBody cardBodyScroll">
            {msg ? (
              <div className="pill pillBlue" style={{ marginBottom: 10 }}>
                <span className="pillDot" aria-hidden="true" />
                {msg}
              </div>
            ) : null}

            {!alerts.length ? (
              <div className="state stateEmpty" style={{ minHeight: 180 }}>
                <div>
                  <div className="stateTitle">No alerts</div>
                  <div className="stateText">Try a different line or filter.</div>
                </div>
              </div>
            ) : (
              <div className="eventsList">
                {alerts.map((a) => (
                  <div key={a._id} className="eventItem">
                    <div className="eventTopRow">
                      <div className="eventTitle">{a.message}</div>
                      <div className="eventTime">
                        <span className="mono">{new Date(a.createdAtTs).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="eventBody">
                      OEE: {Math.round((a.oee || 0) * 100)}% · threshold {Math.round((a.threshold || 0) * 100)}%
                    </div>
                    <div className="eventMetaRow">
                      <StatusPill status={severityToStatus(a.severity)} label={a.severity} />
                      <span className="pill pillGray">
                        <span className="pillDot" aria-hidden="true" />
                        <span className="mono">{a.lineId}</span>
                      </span>
                      <span className="pill pillGray">
                        <span className="pillDot" aria-hidden="true" />
                        Ack: <span className="mono">{String(Boolean(a.acknowledged))}</span>
                      </span>

                      {!a.acknowledged ? (
                        <button className="btnPrimary" onClick={() => ack(a._id)} disabled={busy}>
                          Acknowledge
                        </button>
                      ) : null}
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
              <h2>Downtime log</h2>
              <p>Recent downtime events</p>
            </div>
          </div>
          <div className="cardBody cardBodyScroll">
            {!downtime.length ? (
              <div className="state stateEmpty" style={{ minHeight: 180 }}>
                <div>
                  <div className="stateTitle">No downtime logged</div>
                  <div className="stateText">Downtime events will appear here.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {downtime.map((d) => (
                  <div key={d._id} className="eventItem">
                    <div className="eventTopRow">
                      <div className="eventTitle">{d.reason}</div>
                      <div className="eventTime">
                        <span className="mono">{new Date(d.occurredAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="eventBody">
                      {Math.round(d.durationMinutes)} min {d.note ? `· ${d.note}` : ""}
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
              <h2>Quality log</h2>
              <p>Recent quality reject events</p>
            </div>
          </div>
          <div className="cardBody cardBodyScroll">
            {!quality.length ? (
              <div className="state stateEmpty" style={{ minHeight: 180 }}>
                <div>
                  <div className="stateTitle">No quality rejects logged</div>
                  <div className="stateText">Quality events will appear here.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {quality.map((q) => (
                  <div key={q._id} className="eventItem">
                    <div className="eventTopRow">
                      <div className="eventTitle">{q.defectReason}</div>
                      <div className="eventTime">
                        <span className="mono">{new Date(q.occurredAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="eventBody">Rejected: {q.rejectedUnits}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="appFooter">
        <div className="footerLeft">
          <span className="footerBrand">OEE Monitor</span>
          <span className="footerSep">•</span>
          <span className="footerMuted">Supervisor console</span>
        </div>
        <div className="footerRight">
          <span className="footerMuted mono">{lineId}</span>
        </div>
      </footer>
    </div>
  );
}
