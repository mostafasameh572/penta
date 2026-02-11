const express = require("express");
const router = express.Router();

const prisma = require("../prisma");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const { success } = require("../utils/response");

/**
 * GET /events?afterId=1&take=50
 * Admin only
 * - afterId: يرجّع الأحداث اللي id بتاعها أكبر من afterId
 * - take: عدد الأحداث (افتراضي 50 - أقصى حد 200)
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const afterIdRaw = req.query.afterId;
    const takeRaw = req.query.take;

    const afterId = afterIdRaw ? Number(afterIdRaw) : null;

    let take = takeRaw ? Number(takeRaw) : 50;
    if (Number.isNaN(take) || take <= 0) take = 50;
    if (take > 200) take = 200;

    const where = {};
    if (afterId !== null) {
      if (Number.isNaN(afterId)) {
        return res.status(400).json({
          success: false,
          message: "afterId must be a number",
        });
      }
      where.id = { gt: afterId };
    }

    const events = await prisma.eventLog.findMany({
      where,
      orderBy: { id: "asc" }, // ✅ مهم للـ sync
      take,
    });

    const formatted = events.map((e) => ({
      ...e,
      payload: e.payload ? safeJsonParse(e.payload) : null,
    }));

    return success(res, {
      count: formatted.length,
      lastId: formatted.length ? formatted[formatted.length - 1].id : afterId,
      events: formatted,
    });
  } catch (err) {
    next(err);
  }
});

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

module.exports = router;
