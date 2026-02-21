// src/routes/playerPosition.routes.js
const express = require("express");
const router = express.Router();

const requireRole = require("../middleware/requireRole.middleware");
const validate = require("../middleware/validate.middleware");
const auth = require("../middleware/auth.middleware");

const { success, error } = require("../utils/response");

const {
  assignPlayerToPosition,
  getAllPlayerPositions,
  setPrimaryPosition,
  unassignPlayerFromPosition,
} = require("../services/playerPosition.service");

const schemas = require("../validators/playerPosition.schema");

function getClubIdOrNull(req) {
  const clubId = req.user?.clubId;
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

// ==============================
// GET all (ADMIN / COACH)
// - ADMIN: all (scoped by club if clubId exists)
// - COACH: only his team players (and scoped by club if clubId exists)
// ==============================
router.get(
  "/",
  auth,
  requireRole("ADMIN", "COACH"),
  validate(schemas.listSchema),
  async (req, res, next) => {
    try {
      const role = req.user.role;
      const teamId = req.user.teamId ?? null;
      const clubId = getClubIdOrNull(req);

      const data = await getAllPlayerPositions({
        role,
        teamId,
        clubId,
      });

      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// POST assign (ADMIN)
// ==============================
router.post(
  "/",
  auth,
  requireRole("ADMIN"),
  validate(schemas.createSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);

      const created = await assignPlayerToPosition({
        ...req.body,
        clubId,
      });

      return success(res, created, 201);
    } catch (err) {
      if (err?.status) return error(res, err.message, err.status);
      next(err);
    }
  }
);

// ==============================
// PUT set primary (ADMIN)
// ==============================
router.put(
  "/primary",
  auth,
  requireRole("ADMIN"),
  validate(schemas.setPrimarySchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);
      const { playerId, positionId } = req.body;

      const updated = await setPrimaryPosition(playerId, positionId, clubId);

      return success(res, updated);
    } catch (err) {
      if (err?.status) return error(res, err.message, err.status);
      next(err);
    }
  }
);

// ==============================
// DELETE unassign (ADMIN)
// ==============================
router.delete(
  "/",
  auth,
  requireRole("ADMIN"),
  validate(schemas.unassignSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);
      const { playerId, positionId } = req.body;

      const result = await unassignPlayerFromPosition(playerId, positionId, clubId);

      return success(res, result);
    } catch (err) {
      if (err?.status) return error(res, err.message, err.status);
      next(err);
    }
  }
);

module.exports = router;