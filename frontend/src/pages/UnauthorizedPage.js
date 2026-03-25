import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function UnauthorizedPage() {
  /** Shown when a user tries to access a page without sufficient role. */
  return (
    <div style={{ padding: 22, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ margin: "16px 0 6px 0" }}>Unauthorized</h1>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
        Your account does not have permission to view this page.
      </p>

      <div style={{ marginTop: 12 }}>
        <Link to="/" className="btnSubtle" style={{ display: "inline-block", textDecoration: "none" }}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
