import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
export default function RequireRole({ minRole = "operator", children }) {
  /** Guard component: requires authentication and at least the given role. */
  const { user, loading, hasRole } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!hasRole(minRole)) return <Navigate to="/unauthorized" replace />;

  return children;
}
