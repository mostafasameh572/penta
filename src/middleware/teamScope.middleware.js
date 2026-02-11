// src/middleware/teamScope.middleware.js
module.exports = function teamScope(req, res, next) {
  try {
    const role = req.user?.role;
    const teamId = req.user?.teamId ?? null;

    // Admin يشوف الكل
    if (role === "ADMIN") {
      req.scopeTeamId = null;
      return next();
    }

    // Coach لازم يكون مربوط بتيم
    if (role === "COACH") {
      if (!teamId) {
        return res.status(403).json({
          success: false,
          message: "Coach has no team assigned",
        });
      }
      req.scopeTeamId = teamId;
      return next();
    }

    // أي رول تاني مش مسموح هنا
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  } catch (e) {
    next(e);
  }
};
