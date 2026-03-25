import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

import { useOeeStream } from "./data/useOeeStream";
import { formatPercent, formatTimestampTime } from "./utils/format";

import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import KpiCard from "./components/kpi/KpiCard";
import TrendChart from "./components/charts/TrendChart";
import NotificationsPanel from "./components/notifications/NotificationsPanel";
import StatusPill from "./components/common/StatusPill";

// PUBLIC_INTERFACE
function App() {
  /** Main app entrypoint for the OEE dashboard UI.
   *
   * Uses a resilient data hook that prefers real backend/WS if configured via env vars,
   * but falls back to mock real-time data generation otherwise.
   *
   * Returns:
   *  - React element tree rendering the full dashboard.
   */
  const [activeNav, setActiveNav] = useState("dashboard");

  const [selectedLineId, setSelectedLineId] = useState("line-1");
  const [timeRange, setTimeRange] = useState("15m"); // 15m | 1h | 8h | 24h

  const {
    status,
    snapshot,
    series,
    events,
    lastUpdatedAt,
    source,
    error,
    reconnect,
  } = useOeeStream({
    lineId: selectedLineId,
    timeRange,
  });

  // Keep the document title in sync with the app
  useEffect(() => {
    document.title = "Ocean OEE Monitor";
  }, []);

  const kpis = useMemo(() => {
    const s = snapshot?.kpis;
    if (!s) return null;
    return [
      {
        key: "availability",
        title: "Availability",
        value: s.availability,
        hint: "Uptime vs. planned time",
        color: "blue",
      },
      {
        key: "performance",
        title: "Performance",
        value: s.performance,
        hint: "Actual vs. ideal speed",
        color: "amber",
      },
      {
        key: "quality",
        title: "Quality",
        value: s.quality,
        hint: "Good count vs. total",
        color: "blue",
      },
      {
        key: "oee",
        title: "OEE",
        value: s.oee,
        hint: "Availability × Performance × Quality",
        color: "amber",
        emphasized: true,
      },
    ];
  }, [snapshot]);

  const hasAnyData = Boolean(snapshot) && (series?.length ?? 0) > 0;

  return (
    <div className="appShell">
      <Sidebar active={activeNav} onSelect={setActiveNav} />

      <div className="appMain">
        <TopBar
          title="Real-time OEE Dashboard"
          subtitle="Ocean Professional theme · live shop-floor visibility"
          source={source}
          status={status}
          lastUpdatedAt={lastUpdatedAt}
          selectedLineId={selectedLineId}
          timeRange={timeRange}
          onChangeLine={setSelectedLineId}
          onChangeTimeRange={setTimeRange}
          onReconnect={reconnect}
        />

        <main className="contentGrid" aria-label="OEE dashboard content">
          <section className="kpiGrid" aria-label="Key performance indicators">
            {kpis ? (
              kpis.map((k) => (
                <KpiCard
                  key={k.key}
                  title={k.title}
                  value={k.value}
                  valueLabel={formatPercent(k.value)}
                  hint={k.hint}
                  color={k.color}
                  emphasized={k.emphasized}
                  trend={snapshot?.trends?.[k.key] ?? null}
                />
              ))
            ) : (
              <>
                <KpiCard loading />
                <KpiCard loading />
                <KpiCard loading />
                <KpiCard loading />
              </>
            )}
          </section>

          <section className="card chartCard" aria-label="OEE trend chart">
            <div className="cardHeader">
              <div className="cardHeaderTitle">
                <h2>OEE trend</h2>
                <p>
                  {selectedLineId.toUpperCase()} · {timeRange} window
                </p>
              </div>
              <div className="cardHeaderMeta">
                <StatusPill
                  status={status}
                  label={
                    status === "connected"
                      ? "Live"
                      : status === "connecting"
                        ? "Connecting"
                        : status === "error"
                          ? "Error"
                          : "Idle"
                  }
                />
                <div className="metaText" aria-label="Last update timestamp">
                  {lastUpdatedAt ? (
                    <>
                      Updated{" "}
                      <span className="mono">
                        {formatTimestampTime(lastUpdatedAt)}
                      </span>
                    </>
                  ) : (
                    "Waiting for data…"
                  )}
                </div>
              </div>
            </div>

            <div className="cardBody">
              {status === "error" ? (
                <div className="state stateError" role="alert">
                  <div className="stateTitle">Data connection error</div>
                  <div className="stateText">
                    {error?.message ??
                      "Unable to load live data right now. The app will keep trying."}
                  </div>
                  <div className="stateActions">
                    <button className="btnPrimary" onClick={reconnect}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : !hasAnyData && status !== "connecting" ? (
                <div className="state stateEmpty">
                  <div className="stateTitle">No data yet</div>
                  <div className="stateText">
                    Select a different line or time range, or wait for the next
                    update.
                  </div>
                </div>
              ) : (
                <TrendChart
                  series={series}
                  width={0}
                  height={0}
                  ariaLabel="OEE time series chart"
                />
              )}

              <div className="chartLegend" aria-label="Chart legend">
                <div className="legendItem">
                  <span className="dot dotBlue" aria-hidden="true" />
                  OEE
                </div>
                <div className="legendItem">
                  <span className="dot dotAmber" aria-hidden="true" />
                  Availability
                </div>
                <div className="legendItem">
                  <span className="dot dotGray" aria-hidden="true" />
                  Performance
                </div>
                <div className="legendItem">
                  <span className="dot dotTeal" aria-hidden="true" />
                  Quality
                </div>
              </div>
            </div>
          </section>

          <section className="card eventsCard" aria-label="Notifications panel">
            <div className="cardHeader">
              <div className="cardHeaderTitle">
                <h2>Events & notifications</h2>
                <p>Downtime, speed loss, quality alarms</p>
              </div>
              <div className="cardHeaderMeta">
                <span className="metaTag" title="Data source">
                  Source: <span className="mono">{source}</span>
                </span>
              </div>
            </div>
            <div className="cardBody cardBodyScroll">
              <NotificationsPanel events={events} />
            </div>
          </section>
        </main>

        <footer className="appFooter">
          <div className="footerLeft">
            <span className="footerBrand">Ocean OEE Monitor</span>
            <span className="footerSep">•</span>
            <span className="footerMuted">
              {source === "mock"
                ? "Mock real-time stream (no env vars configured)"
                : "Backend-connected (env vars detected)"}
            </span>
          </div>
          <div className="footerRight">
            <span className="footerMuted mono">
              {process.env.REACT_APP_NODE_ENV ?? "development"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
