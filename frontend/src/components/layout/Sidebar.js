import React from "react";

const NAV = [
  { key: "dashboard", label: "Dashboard", hint: "Live", icon: "📈" },
  { key: "lines", label: "Lines", hint: "3", icon: "🏭" },
  { key: "alerts", label: "Alerts", hint: "!", icon: "🔔" },
  { key: "settings", label: "Settings", hint: "⚙", icon: "⚙️" },
];

// PUBLIC_INTERFACE
export default function Sidebar({ active, onSelect }) {
  /** Sidebar navigation for the dashboard. */
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebarHeader">
        <div className="brandMark" aria-hidden="true" />
        <div className="brandText">
          <div className="brandTitle">Ocean OEE</div>
          <div className="brandSub">Professional Monitor</div>
        </div>
      </div>

      <nav className="sidebarNav" aria-label="Dashboard sections">
        {NAV.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              className={`navItem ${isActive ? "navItemActive" : ""}`}
              onClick={() => onSelect?.(item.key)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="navIcon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="navLabel">{item.label}</span>
              <span className="navHint" aria-hidden="true">
                {item.hint}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebarFooter">
        <div style={{ fontWeight: 800 }}>Tip</div>
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          Configure <span className="mono">REACT_APP_WS_URL</span> to stream real
          production metrics. Otherwise, mock data is generated automatically.
        </div>
      </div>
    </aside>
  );
}
