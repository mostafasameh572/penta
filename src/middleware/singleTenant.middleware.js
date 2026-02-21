// src/middleware/singleTenant.middleware.js
function toIntOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = (req, res, next) => {
  const forcedClubId = toIntOrNull(process.env.SINGLE_CLUB_ID);

  // لو مش محدد SINGLE_CLUB_ID -> سيب النظام كما هو
  if (!forcedClubId) return next();

  // لازم authMiddleware قبلنا (بس لو مش موجود نعمل واحد)
  if (!req.user) req.user = {};

  // فرض النادي الواحد
  req.user.clubId = forcedClubId;

  return next();
};