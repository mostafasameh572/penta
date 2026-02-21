// src/routes/category.routes.js
const express = require("express");
const router = express.Router();

const prisma = require("../prisma");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const validate = require("../middleware/validate.middleware");
const { z } = require("zod");

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Categories management
 */

// ============== Helpers ==============
function getClubIdOrNull(req) {
  const clubId = req.user?.clubId;
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

// ============== Zod Schemas ==============
const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.any().optional(),
  query: z.any().optional(),
});

const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "name is required"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const updateSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1, "name is required"),
  }),
  query: z.any().optional(),
});

// ============== Routes ==============

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", auth, async (req, res, next) => {
  try {
    const clubId = getClubIdOrNull(req);

    const categories = await prisma.category.findMany({
      where: clubId ? { clubId } : undefined, // ✅ isolate if clubId exists
      orderBy: { id: "asc" },
    });

    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create category (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "U16" }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Duplicate name }
 */
router.post("/", auth, isAdmin, validate(createSchema), async (req, res, next) => {
  try {
    const clubId = getClubIdOrNull(req);

    const created = await prisma.category.create({
      data: {
        name: req.body.name,
        // ✅ attach clubId if exists (Phase 2A)
        clubId: clubId ?? null,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err); // ✅ let errorHandler handle Prisma errors
  }
});

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category (Admin)
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
 *               name: { type: string, example: "U17" }
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 *       409: { description: Duplicate name }
 */
router.put("/:id", auth, isAdmin, validate(updateSchema), async (req, res, next) => {
  try {
    const clubId = getClubIdOrNull(req);
    const id = Number(req.params.id);

    // ✅ cross-club protection (only if clubId exists)
    if (clubId) {
      const exists = await prisma.category.findFirst({
        where: { id, clubId },
        select: { id: true },
      });
      if (!exists) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: req.body.name },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category (Admin)
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
 */
router.delete("/:id", auth, isAdmin, validate(idParamSchema), async (req, res, next) => {
  try {
    const clubId = getClubIdOrNull(req);
    const id = Number(req.params.id);

    // ✅ cross-club protection
    if (clubId) {
      const exists = await prisma.category.findFirst({
        where: { id, clubId },
        select: { id: true },
      });
      if (!exists) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
    }

    await prisma.category.delete({ where: { id } });

    return res.json({ success: true, data: { message: "Category deleted" } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;