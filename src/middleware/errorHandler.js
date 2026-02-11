// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";

  function short(str, max = 220) {
    const s = String(str || "");
    return s.length > max ? s.slice(0, max) + "..." : s;
  }

  // ✅ Extract a safe, single-line Prisma message (no file paths / invocation snippet)
  function prismaMsg(message) {
    const lines = String(message || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Prefer known summary lines
    const known = lines.find((l) =>
      /unique constraint failed|foreign key constraint violated|record.*not found/i.test(l)
    );
    if (known) return known;

    // Otherwise use last non-empty line (usually contains the actual error)
    const last = lines[lines.length - 1] || "";
    return last || "Prisma error";
  }

  // =========================
  // Invalid JSON (body-parser)
  // =========================
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
      ...(isDev ? { debug: short(err.message, 180) } : {}),
    });
  }

  // =========================
  // Prisma Known Errors
  // =========================

  // P2002 => Unique constraint failed
  if (err && err.code === "P2002") {
    const targetRaw = err.meta?.target;

    const targetArr = Array.isArray(targetRaw)
      ? targetRaw.map((x) => String(x).toLowerCase())
      : typeof targetRaw === "string"
      ? [targetRaw.toLowerCase()]
      : [];

    const hasCols = (...cols) =>
      cols.every((c) => targetArr.includes(String(c).toLowerCase()));

    // Players compound uniques
    if (hasCols("teamid", "shirtnumber")) {
      return res.status(409).json({
        success: false,
        message: "Shirt number already exists in this team",
      });
    }

    if (hasCols("teamid", "fullnamenorm", "birthyear")) {
      return res.status(409).json({
        success: false,
        message: "Player already exists in this team (same name and birth year)",
      });
    }

    const payload = { success: false, message: "Duplicate name" };

    if (isDev) {
      payload.debug = {
        name: err.name || "PrismaError",
        code: err.code,
        target: targetRaw || null,
        clientVersion: err.clientVersion || null,
        message: short(prismaMsg(err.message), 200), // ✅ safe summary
      };
    }

    return res.status(409).json(payload);
  }

  // P2003 => Foreign key constraint failed
  if (err && err.code === "P2003") {
    const payload = { success: false, message: "Foreign key constraint violated" };
    if (isDev) {
      payload.debug = {
        name: err.name || "PrismaError",
        code: err.code,
        field: err.meta?.field_name || err.meta?.field || null,
        message: short(prismaMsg(err.message), 200), // ✅ safe summary
      };
    }
    return res.status(409).json(payload);
  }

  // P2025 => Record not found
  if (err && err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  // Prisma validation errors
  if (err && err.name === "PrismaClientValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      ...(isDev ? { debug: short(prismaMsg(err.message), 200) } : {}),
    });
  }

  // =========================
  // Custom HTTP-like errors
  // =========================
  if (err && Number.isInteger(err.status) && err.status >= 400 && err.status <= 599) {
    return res.status(err.status).json({
      success: false,
      message: err.message || "Request failed",
      ...(isDev ? { debug: short(err.message, 180) } : {}),
    });
  }

  // =========================
  // Default error
  // =========================
  console.error("❌ ERROR:", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(isDev ? { debug: short(err.message || err, 220) } : {}),
  });
};
