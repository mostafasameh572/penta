// src/index.js
require("dotenv").config(); // لازم أول سطر

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const { validateEnv } = require("./config/validateEnv");

// ✅ Validate env early
validateEnv();

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// لو عندك CORS_ORIGINS في env بالشكل ده: "https://a.com,https://b.com"
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// ================= basics =================
app.set("trust proxy", 1);
app.use(express.json());

// ✅ Security headers
app.use(helmet());

// ✅ CORS
const corsOptions = {
  origin: (origin, cb) => {
    // Requests without Origin (curl / server-to-server / Postman) -> allow
    if (!origin) return cb(null, true);

    // dev: allow all
    if (!isProd) return cb(null, true);

    // prod: allowlist
    if (Array.isArray(CORS_ORIGINS) && CORS_ORIGINS.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error("CORS_BLOCKED"));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ✅ Handle CORS errors nicely
app.use((err, req, res, next) => {
  if (err && err.message === "CORS_BLOCKED") {
    return res.status(403).json({ success: false, message: "CORS blocked" });
  }
  next(err);
});

// ✅ Serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================= health =================
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    env: NODE_ENV,
    time: new Date().toISOString(),
  });
});

// ================= debug =================
app.get("/__whoami", (req, res) => {
  res.json({
    server: "src/index.js",
    time: new Date().toISOString(),
  });
});

// ================= swagger =================
const { swaggerUi, swaggerSpec } = require("./docs/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ================= middleware =================
const authMiddleware = require("./middleware/auth.middleware");
const { applyApiLimiter, applyLoginLimiter } = require("./middleware/rateLimiters");

// ================= routes =================
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const playerAdminRoutes = require("./routes/player.admin.routes");

const playerRoutes = require("./routes/player.routes");
const teamRoutes = require("./routes/team.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const uploadRoutes = require("./routes/upload.routes");
const eventRoutes = require("./routes/events.routes");

const categoryRoutes = require("./routes/category.routes");
const mediaRoutes = require("./routes/media.routes");
const positionRoutes = require("./routes/position.routes");
const playerPositionRoutes = require("./routes/playerPosition.routes");
const playerProfileRoutes = require("./routes/playerProfile.routes");
const playerStatsRoutes = require("./routes/playerStats.routes");

// ================= route mounting =================
app.use("/auth/login", applyLoginLimiter);
app.use("/auth", authRoutes);

app.use(applyApiLimiter);

app.use("/admin", adminRoutes);
app.use("/admin/players", playerAdminRoutes);

app.use("/dashboard", dashboardRoutes);
app.use("/upload", uploadRoutes);
app.use("/events", eventRoutes);

app.use("/teams", authMiddleware, teamRoutes);
app.use("/players", authMiddleware, playerRoutes);
app.use("/players", authMiddleware, playerProfileRoutes);

app.use("/categories", authMiddleware, categoryRoutes);
app.use("/media", authMiddleware, mediaRoutes);
app.use("/positions", authMiddleware, positionRoutes);
app.use("/player-positions", authMiddleware, playerPositionRoutes);
app.use("/player-stats", authMiddleware, playerStatsRoutes);

// ================= error handler =================
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ================= server =================
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger Docs on http://localhost:${PORT}/api-docs`);
  console.log(`🧾 Swagger JSON on http://localhost:${PORT}/api-docs.json`);
  console.log(`🖼️ Uploads served on http://localhost:${PORT}/uploads`);
  console.log(`❤️ Health check on http://localhost:${PORT}/health`);
  console.log(
    `🔒 env=${NODE_ENV} | prodCorsOrigins=${
      Array.isArray(CORS_ORIGINS) ? CORS_ORIGINS.length : 0
    }`
  );
});

// ✅ Graceful shutdown (Prod-ready)
function shutdown(signal) {
  console.log(`\n🧯 ${signal} received. Shutting down...`);
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });

  // لو قفلش خلال 10 ثواني
  setTimeout(() => {
    console.error("⛔ Force shutdown");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("⛔ unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("⛔ uncaughtException:", err);
  // الأفضل نعمل shutdown لأن الحالة تبقى غير مضمونة
  try {
    server.close(() => process.exit(1));
  } catch (e) {
    process.exit(1);
  }
});
module.exports = app;
