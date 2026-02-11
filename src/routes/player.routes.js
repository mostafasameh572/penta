// src/routes/player.routes.js
const express = require("express");
const router = express.Router();

const isAdmin = require("../middleware/isAdmin.middleware");
const requireRole = require("../middleware/requireRole.middleware");
const requireActivePlayer = require("../middleware/requireActivePlayer.middleware");

const validate = require("../middleware/validate.middleware");
const schemas = require("../validators/player.schema");

const controller = require("../controllers/player.controller");

// ✅ Guard: COACH ممنوع يبعت teamId/includeInactive أصلاً
function guardCoachQuery(req, res, next) {
  try {
    if (req.user?.role === "COACH") {
      if (req.query.teamId !== undefined && req.query.teamId !== "") {
        return res.status(403).json({
          success: false,
          message: "Coach cannot filter by teamId (scoped automatically)",
        });
      }
      if (req.query.includeInactive !== undefined) {
        return res.status(403).json({
          success: false,
          message: "Coach cannot include inactive players",
        });
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}

// ✅ Coach لازم يكون مربوط بفريق
function requireCoachTeam(req, res, next) {
  try {
    if (req.user?.role === "COACH") {
      const teamId = req.user?.teamId ?? null;
      if (!teamId) {
        return res.status(403).json({
          success: false,
          message: "Coach has no team assigned",
        });
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}

// ✅ Read: Admin/Coach
router.get(
  "/",
  requireRole("ADMIN", "COACH"),
  requireCoachTeam,
  guardCoachQuery,
  validate(schemas.listSchema),
  controller.getAllPlayers
);

router.get(
  "/:id",
  requireRole("ADMIN", "COACH"),
  requireCoachTeam,
  validate(schemas.getByIdSchema),
  controller.getPlayerById
);

// ✅ Admin only (CRUD)
router.post("/", isAdmin, validate(schemas.createSchema), controller.createPlayer);

router.put(
  "/:id",
  isAdmin,
  validate(schemas.updateSchema),
  requireActivePlayer,
  controller.updatePlayer
);

router.delete(
  "/:id",
  isAdmin,
  validate(schemas.deleteSchema),
  requireActivePlayer,
  controller.deletePlayer
);

router.put("/:id/deactivate", isAdmin, validate(schemas.activateSchema), controller.deactivatePlayer);
router.put("/:id/activate", isAdmin, validate(schemas.activateSchema), controller.activatePlayer);

router.put(
  "/:id/stats",
  isAdmin,
  validate(schemas.statsSchema),
  requireActivePlayer,
  controller.updatePlayerStats
);

module.exports = router;
