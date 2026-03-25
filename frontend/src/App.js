import React, { useEffect } from "react";
import "./App.css";

import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireRole from "./auth/RequireRole";

import OperatorDashboard from "./pages/OperatorDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function Shell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebarHeader">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="brandTitle">Ocean OEE</div>
            <div className="brandSub">Role-based Monitor</div>
          </div>
        </div>

        <nav className="sidebarNav" aria-label="App sections">
          <Link className="navItem" to="/" style={{ textDecoration: "none" }}>
            <span className="navIcon" aria-hidden="true">
              📈
            </span>
            <span className="navLabel">Operator</span>
            <span className="navHint" aria-hidden="true">
              O
            </span>
          </Link>

          <Link className="navItem" to="/supervisor" style={{ textDecoration: "none" }}>
            <span className="navIcon" aria-hidden="true">
              🔔
            </span>
            <span className="navLabel">Supervisor</span>
            <span className="navHint" aria-hidden="true">
              S
            </span>
          </Link>

          <Link className="navItem" to="/manager" style={{ textDecoration: "none" }}>
            <span className="navIcon" aria-hidden="true">
              🧾
            </span>
            <span className="navLabel">Manager</span>
            <span className="navHint" aria-hidden="true">
              M
            </span>
          </Link>
        </nav>

        <div className="sidebarFooter">
          {user ? (
            <>
              <div style={{ fontWeight: 800 }}>Signed in</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>
                <span className="mono">{user.email}</span> · <span className="mono">{user.role}</span>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btnSubtle" onClick={logout}>
                  Logout
                </button>
                <Link className="btnSubtle" to="/login" style={{ textDecoration: "none" }}>
                  Switch user
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800 }}>Not signed in</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>
                <Link to="/login" style={{ color: "inherit" }}>
                  Sign in
                </Link>{" "}
                to use backend APIs.
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="appMain">{children}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** App entrypoint: role-based router + auth provider. */
  useEffect(() => {
    document.title = "Ocean OEE Monitor (RBAC)";
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            path="/"
            element={
              <RequireRole minRole="operator">
                <Shell>
                  <OperatorDashboard />
                </Shell>
              </RequireRole>
            }
          />

          <Route
            path="/supervisor"
            element={
              <RequireRole minRole="supervisor">
                <Shell>
                  <SupervisorDashboard />
                </Shell>
              </RequireRole>
            }
          />

          <Route
            path="/manager"
            element={
              <RequireRole minRole="manager">
                <Shell>
                  <ManagerDashboard />
                </Shell>
              </RequireRole>
            }
          />

          <Route
            path="*"
            element={
              <Shell>
                <div style={{ padding: 22 }}>
                  <h1 style={{ margin: 0 }}>Not found</h1>
                  <p style={{ color: "var(--muted)", marginTop: 6 }}>This page does not exist.</p>
                  <Link to="/" className="btnSubtle" style={{ display: "inline-block", textDecoration: "none" }}>
                    Back to dashboard
                  </Link>
                </div>
              </Shell>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
