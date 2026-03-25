const jwt = require("jsonwebtoken");

/**
 * Signs a JWT for the given user payload.
 * @param {{id:string, email:string, role:string}} user
 * @param {{jwtSecret:string, jwtExpiresIn:string}} cfg
 */
function signToken(user, cfg) {
  if (!cfg.jwtSecret) throw new Error("JWT_SECRET is missing.");
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiresIn }
  );
}

/**
 * Express middleware that validates JWT and attaches req.user.
 * @param {{jwtSecret:string}} cfg
 */
function requireAuth(cfg) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
      if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });
      if (!cfg.jwtSecret) return res.status(500).json({ error: "Server JWT not configured" });

      const decoded = jwt.verify(token, cfg.jwtSecret);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

module.exports = { signToken, requireAuth };
