const { isAtLeast } = require("./roles");

/**
 * Express middleware that enforces a minimum role.
 * Assumes req.user exists (so use after requireAuth()).
 * @param {string} minRole
 */
function requireRole(minRole) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "Unauthorized" });
    if (!isAtLeast(role, minRole)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

module.exports = { requireRole };
