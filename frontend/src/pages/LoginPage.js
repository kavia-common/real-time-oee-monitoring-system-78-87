import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login page for all roles. */
  const { login, loading, error } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const from = useMemo(() => loc.state?.from || "/", [loc.state]);

  const [email, setEmail] = useState("operator@example.com");
  const [password, setPassword] = useState("operator123");
  const [formError, setFormError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    const res = await login({ email, password });
    if (res.ok) nav(from, { replace: true });
    else setFormError(res.error || "Login failed");
  }

  return (
    <div style={{ padding: 22, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ margin: "16px 0 6px 0" }}>Sign in</h1>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
        Use seeded users (backend seed) or your own registered account.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardBody">
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Email</span>
              <input
                className="select"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Password</span>
              <input
                className="select"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {(formError || error) && (
              <div className="pill pillRed" role="alert">
                <span className="pillDot" aria-hidden="true" />
                {formError || error?.message}
              </div>
            )}

            <button className="btnPrimary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              No account? <Link to="/register">Register</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
