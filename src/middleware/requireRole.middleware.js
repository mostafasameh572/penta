// D:\penta\src\middleware\requireRole.middleware.js

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = String(req.user.role || "").toUpperCase();

    if (!allowedRoles.map(r => String(r).toUpperCase()).includes(role)) {
      return res.status(403).json({
        message: `Access denied (${allowedRoles.join(" / ")} only)`,
      });
    }

    next();
  };
};
