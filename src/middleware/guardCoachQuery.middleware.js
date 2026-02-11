// D:\penta\src\middleware\guardCoachQuery.middleware.js

const { error } = require("../utils/response");

module.exports = (req, res, next) => {
  try {
    if (req.user?.role === "COACH") {
      // Coach ممنوع يطلب includeInactive
      if (String(req.query.includeInactive) === "true") {
        return error(res, "includeInactive is admin-only", 403);
      }

      // Coach ممنوع يفلتر teamId يدويًا
      if (req.query.teamId !== undefined && req.query.teamId !== "") {
        return error(res, "teamId filter is admin-only", 403);
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
