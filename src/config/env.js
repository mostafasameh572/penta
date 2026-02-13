// src/config/env.js

function must(name) {
  const v = process.env[name];
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name, def = undefined) {
  const v = process.env[name];
  if (!v || String(v).trim() === "") return def;
  return v;
}

// "a,b,c" -> ["a","b","c"]
function csv(name, def = "") {
  const v = optional(name, def);
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// رقم مع fallback لو NaN
function num(name, def) {
  const v = optional(name, def);
  const n = Number(v);
  return Number.isFinite(n) ? n : Number(def);
}

// رقم موجب فقط (>=1) مع fallback
function posNum(name, def) {
  const n = num(name, def);
  return Number.isFinite(n) && n >= 1 ? n : Number(def);
}

const NODE_ENV = String(optional("NODE_ENV", "development")).toLowerCase();
const isProd = NODE_ENV === "production";

// ✅ لو كتبت window بالثواني: نحوله لميلي ثانية
const RATE_LIMIT_WINDOW_SEC = posNum("RATE_LIMIT_WINDOW_SEC", 60);
const RATE_LIMIT_WINDOW_MS =
  posNum("RATE_LIMIT_WINDOW_MS", RATE_LIMIT_WINDOW_SEC * 1000);

module.exports = {
  // ✅ normalize
  NODE_ENV,

  // ✅ safe numbers
  PORT: posNum("PORT", 3000),

  // ✅ JWT secret:
  // - في production لازم
  // - في dev اختياري (عشان التطوير ما يتعطلش)
  JWT_SECRET: isProd
    ? must("JWT_SECRET")
    : String(optional("JWT_SECRET", "dev_secret")),

  // ✅ DB URLs (اختياري - مفيد للـ prod/CI)
  DATABASE_URL: optional("DATABASE_URL"),
  DATABASE_URL_TEST: optional("DATABASE_URL_TEST"),
  DATABASE_URL_PROD: optional("DATABASE_URL_PROD"),

  // ✅ CORS allowlist (production)
  // مثال: CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
  CORS_ORIGINS: csv("CORS_ORIGINS", ""),

  // ✅ Rate limit (requests per window)
  RATE_LIMIT_MAX: posNum("RATE_LIMIT_MAX", 600),

  // ✅ window for rate limit (ms)
  RATE_LIMIT_WINDOW_MS,

  // ✅ Login limiter (production) (requests per window)
  LOGIN_RATE_LIMIT_MAX: posNum("LOGIN_RATE_LIMIT_MAX", 20),

  // ✅ اختياري: لو تحب تتعامل بالثواني
  RATE_LIMIT_WINDOW_SEC,
};
