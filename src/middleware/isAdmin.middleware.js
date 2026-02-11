// D:\penta\src\middleware\isAdmin.middleware.js

module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // نثبت إن الـ ADMIN دايمًا uppercase
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied (Admin only)",
    });
  }

  next();
};
