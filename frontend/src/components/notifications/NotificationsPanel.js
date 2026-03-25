import React from "react";
import StatusPill from "../common/StatusPill";
import { formatTimestampTime } from "../../utils/format";

function severityToPill(severity) {
  if (severity === "critical") return { status: "critical", label: "Critical" };
  if (severity === "warning") return { status: "warning", label: "Warning" };
  return { status: "info", label: "Info" };
}

// PUBLIC_INTERFACE
export default function NotificationsPanel({ events }) {
  /** Displays events and notifications for the selected line. */
  const list = Array.isArray(events) ? events : [];

  if (!list.length) {
    return (
      <div className="state stateEmpty" style={{ minHeight: 220 }}>
        <div>
          <div className="stateTitle">No recent events</div>
          <div className="stateText">
            Events will appear here as performance, downtime, or quality changes occur.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eventsList" aria-label="Events list">
      {list.map((e) => {
        const pill = severityToPill(e.severity);
        return (
          <div key={e.id} className="eventItem">
            <div className="eventTopRow">
              <div className="eventTitle">{e.title}</div>
              <div className="eventTime">
                <span className="mono">{formatTimestampTime(e.ts)}</span>
              </div>
            </div>
            <div className="eventBody">{e.message}</div>
            <div className="eventMetaRow">
              <StatusPill status={pill.status} label={pill.label} />
              <span className="pill pillGray">
                <span className="pillDot" aria-hidden="true" />
                <span className="mono">{e.meta?.lineId ?? "line"}</span>
              </span>
              {e.meta?.category ? (
                <span className="pill pillGray">
                  <span className="pillDot" aria-hidden="true" />
                  {e.meta.category}
                </span>
              ) : null}
              {e.meta?.code ? (
                <span className="pill pillGray">
                  <span className="pillDot" aria-hidden="true" />
                  <span className="mono">{e.meta.code}</span>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
