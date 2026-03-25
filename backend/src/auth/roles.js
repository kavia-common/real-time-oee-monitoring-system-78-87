const ROLES = Object.freeze({
  operator: "operator",
  supervisor: "supervisor",
  manager: "manager",
});

// Simple rank-based RBAC: manager > supervisor > operator
const ROLE_RANK = Object.freeze({
  operator: 1,
  supervisor: 2,
  manager: 3,
});

/**
 * Returns true if `role` is at least as privileged as `minRole`.
 * @param {string} role
 * @param {string} minRole
 */
function isAtLeast(role, minRole) {
  const a = ROLE_RANK[role] || 0;
  const b = ROLE_RANK[minRole] || 0;
  return a >= b;
}

module.exports = { ROLES, isAtLeast };
