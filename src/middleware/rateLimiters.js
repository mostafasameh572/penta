// src/middleware/rateLimiters.js
const rateLimit = require("express-rate-limit");
const {
  NODE_ENV,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  LOGIN_RATE_LIMIT_MAX,
} = require("../config/env");

const isProd = NODE_ENV === "production";

// Helper: في dev ما نطبّقش limiter
const devPassthrough = (req, res, next) => next();

// Global API limiter (prod only)
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS || 60_000,
  max: RATE_LIMIT_MAX || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later" },
});

// Login limiter (prod only) - يحسب الفشل فقط (الأفضل ضد brute force)
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS || 60_000,
  max: LOGIN_RATE_LIMIT_MAX || 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts, try again later",
  },
});

/**
 * applyApiLimiter:
 * - prod: يطبق limiter على كل الطلبات
 * - ويستثني:
 *    /health
 *    /api-docs
 *    /uploads (static files)
 * - dev: يسيب الدنيا مفتوحة
 */
const applyApiLimiter = (req, res, next) => {
  if (!isProd) return devPassthrough(req, res, next);

  // استثناءات مهمة
  if (req.path === "/health") return next();
  if (req.path.startsWith("/api-docs")) return next();
  if (req.path.startsWith("/uploads")) return next();

  return apiLimiter(req, res, next);
};

/**
 * applyLoginLimiter:
 * - prod: يطبق limiter على /auth/login فقط
 * - dev: يسيب الدنيا مفتوحة
 */
const applyLoginLimiter = (req, res, next) => {
  if (!isProd) return devPassthrough(req, res, next);
  return loginLimiter(req, res, next);
};

module.exports = {
  applyApiLimiter,
  applyLoginLimiter,
};
