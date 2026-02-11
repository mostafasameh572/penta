// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const debugAuth = process.env.DEBUG_AUTH === "1";
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const authHeader = req.headers.authorization;

    // ✅ Debug log (لو DEBUG_AUTH=1)
    if (debugAuth) {
      console.log(
        `[AUTH] ${req.method} ${req.originalUrl} | header: ${authHeader ? "YES" : "NO"}`
      );
    }

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: isDev ? "No token provided" : "Unauthorized",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: isDev ? "Invalid token format" : "Unauthorized",
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: isDev ? "Invalid token format" : "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      teamId: decoded.teamId ?? null,
    };

    if (req.user.role === "COACH" && !req.user.teamId) {
      return res.status(403).json({
        success: false,
        message: isDev ? "Coach has no team assigned" : "Forbidden",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: isDev ? "Invalid token" : "Unauthorized",
    });
  }
};
