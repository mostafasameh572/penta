const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const prisma = require("../prisma");
const { success, error } = require("../utils/response");
const { logEvent } = require("../services/event.service");

// ✅ Deactivate player (soft delete)
router.put("/:id/deactivate", auth, isAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const exists = await prisma.player.findUnique({ where: { id } });
    if (!exists) return error(res, "Player not found", 404);

    const updated = await prisma.player.update({
      where: { id },
      data: { isActive: false },
      include: { stats: true, team: true },
    });

    await logEvent({
      type: "PLAYER_DEACTIVATED",
      playerId: id,
      source: req.user?.role || "SYSTEM",
      payload: { player: updated },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
});

// ✅ Activate player
router.put("/:id/activate", auth, isAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const exists = await prisma.player.findUnique({ where: { id } });
    if (!exists) return error(res, "Player not found", 404);

    const updated = await prisma.player.update({
      where: { id },
      data: { isActive: true },
      include: { stats: true, team: true },
    });

    await logEvent({
      type: "PLAYER_ACTIVATED",
      playerId: id,
      source: req.user?.role || "SYSTEM",
      payload: { player: updated },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
