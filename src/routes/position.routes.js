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

/**
 * @openapi
 * tags:
 *   - name: Positions
 *     description: Positions management + insights
 */

/**
 * @openapi
 * /positions:
 *   get:
 *     tags: [Positions]
 *     summary: Get all positions (Admin/Coach)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get(
  "/",
  auth,
  requireRole("ADMIN", "COACH"),
  validate(schemas.listSchema),
  async (req, res, next) => {
    try {
      const items = await prisma.position.findMany({ orderBy: { id: "asc" } });
      return success(res, items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /positions:
 *   post:
 *     tags: [Positions]
 *     summary: Create position (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "GK"
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       409: { description: Duplicate }
 */
router.post(
  "/",
  auth,
  isAdmin,
  validate(schemas.createSchema),
  async (req, res, next) => {
    try {
      const name = req.body.name.trim();

      const created = await prisma.position.create({
        data: { name },
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
 * @openapi
 * /positions/{id}:
 *   put:
 *     tags: [Positions]
 *     summary: Update position (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CB"
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 */
router.put(
  "/:id",
  auth,
  isAdmin,
  validate(schemas.updateSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id; // number (z.coerce)
      const name = req.body.name.trim();

      const exists = await prisma.position.findUnique({ where: { id } });
      if (!exists) return error(res, "Position not found", 404);

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
 * @openapi
 * /positions/{id}:
 *   delete:
 *     tags: [Positions]
 *     summary: Delete position (Admin)
 *     description: Will fail if position is referenced by player positions.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 *       409: { description: Cannot delete (Referenced) }
 */
router.delete(
  "/:id",
  auth,
  isAdmin,
  validate(schemas.deleteSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id; // ✅ number (z.coerce)

      const exists = await prisma.position.findUnique({ where: { id } });
      if (!exists) return error(res, "Position not found", 404);

      // ✅ دع الـ DB (FK RESTRICT) تمنع الحذف لو referenced
      await prisma.position.delete({ where: { id } });

      return success(res, { message: "Position deleted" });
    } catch (err) {
      // ✅ لو referenced -> Prisma P2003
      if (err?.code === "P2003") {
        return error(res, "Cannot delete (position is referenced)", 409);
      }
      next(err);
    }
  }
);

/**
 * @openapi
 * /positions/{id}/best-player:
 *   get:
 *     tags: [Positions]
 *     summary: Get best player for a position (Admin/Coach)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 1
 *     responses:
 *       200: { description: OK }
 *       400: { description: Validation error }
 *       404: { description: No players/stats found }
 */
router.get(
  "/:id/best-player",
  auth,
  requireRole("ADMIN", "COACH"),
  validate(schemas.bestPlayerSchema),
  async (req, res, next) => {
    try {
      const result = await getBestPlayerByPosition(req.params.id);

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
