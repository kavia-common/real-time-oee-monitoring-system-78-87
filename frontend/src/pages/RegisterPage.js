import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ROLES = [
  { id: "operator", name: "Operator" },
  { id: "supervisor", name: "Supervisor" },
  { id: "manager", name: "Manager" },
];

// PUBLIC_INTERFACE
export default function RegisterPage() {
  /** Registration page. */
  const { register, loading, error } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operator");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    const res = await register({ name, email, role, password });
    if (res.ok) nav("/", { replace: true });
    else setFormError(res.error || "Registration failed");
  }

  return (
    <div style={{ padding: 22, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ margin: "16px 0 6px 0" }}>Create account</h1>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
        Choose a role for demo. In production, role assignment should be admin-controlled.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardBody">
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Name</span>
              <input className="select" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

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
              <span className="controlLabel">Role</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="controlLabel">Password</span>
              <input
                className="select"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 chars"
              />
            </label>

            {(formError || error) && (
              <div className="pill pillRed" role="alert">
                <span className="pillDot" aria-hidden="true" />
                {formError || error?.message}
              </div>
            )}

            <button className="btnPrimary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
