// src/routes/position.routes.js
const express = require("express");
const router = express.Router();

const prisma = require("../prisma");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const requireRole = require("../middleware/requireRole.middleware");
const validate = require("../middleware/validate.middleware");

const { success, error } = require("../utils/response");
const { getBestPlayerByPosition } = require("../services/position.service");

const schemas = require("../validators/position.schema");

function getClubIdOrNull(req) {
  const clubId = req.user?.clubId;
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET ALL POSITIONS
 */
router.get(
  "/",
  auth,
  requireRole("ADMIN", "COACH"),
  validate(schemas.listSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);

      const items = await prisma.position.findMany({
        where: clubId ? { clubId } : undefined,
        orderBy: { id: "asc" },
      });

      return success(res, items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * CREATE POSITION (Admin)
 */
router.post(
  "/",
  auth,
  isAdmin,
  validate(schemas.createSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);
      const name = req.body.name.trim();

      const created = await prisma.position.create({
        data: {
          name,
          clubId: clubId ?? null,
        },
      });

      return success(res, created, 201);
    } catch (err) {
      if (err?.code === "P2002") {
        return error(res, "Duplicate name", 409);
      }
      next(err);
    }
  }
);

/**
 * UPDATE POSITION
 */
router.put(
  "/:id",
  auth,
  isAdmin,
  validate(schemas.updateSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);
      const id = Number(req.params.id);
      const name = req.body.name.trim();

      if (clubId) {
        const exists = await prisma.position.findFirst({
          where: { id, clubId },
        });
        if (!exists) return error(res, "Position not found", 404);
      }

      const updated = await prisma.position.update({
        where: { id },
        data: { name },
      });

      return success(res, updated);
    } catch (err) {
      if (err?.code === "P2002") {
        return error(res, "Duplicate name", 409);
      }
      next(err);
    }
  }
);

/**
 * DELETE POSITION
 */
router.delete(
  "/:id",
  auth,
  isAdmin,
  validate(schemas.deleteSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);
      const id = Number(req.params.id);

      if (clubId) {
        const exists = await prisma.position.findFirst({
          where: { id, clubId },
        });
        if (!exists) return error(res, "Position not found", 404);
      }

      await prisma.position.delete({ where: { id } });

      return success(res, { message: "Position deleted" });
    } catch (err) {
      if (err?.code === "P2003") {
        return error(res, "Cannot delete (position is referenced)", 409);
      }
      next(err);
    }
  }
);

/**
 * BEST PLAYER BY POSITION
 */
router.get(
  "/:id/best-player",
  auth,
  requireRole("ADMIN", "COACH"),
  validate(schemas.bestPlayerSchema),
  async (req, res, next) => {
    try {
      const clubId = getClubIdOrNull(req);

      const result = await getBestPlayerByPosition(req.params.id, clubId);

      if (!result) {
        return error(res, "No players or stats found for this position", 404);
      }

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;