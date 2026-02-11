// src/config/validateEnv.js
function requireEnv(name) {
  const v = process.env[name];
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function validateEnv() {
  // لازم في أي بيئة
  requireEnv("JWT_SECRET");

  // PORT اختياري بس الأفضل موجود
  if (!process.env.PORT) process.env.PORT = "3000";
}

module.exports = { validateEnv };
