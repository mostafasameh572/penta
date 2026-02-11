// src/routes/media.routes.js
const express = require("express");
const router = express.Router();

const prisma = require("../prisma");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const { success, error } = require("../utils/response");

// ✅ Prisma error helper
function isPrismaErr(err, code) {
  return err && err.code === code;
}

/**
 * @openapi
 * tags:
 *   - name: Media
 *     description: Media management
 */

/**
 * @openapi
 * /media:
 *   get:
 *     tags: [Media]
 *     summary: Get all media (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const items = await prisma.media.findMany({
      orderBy: { id: "desc" },
    });
    return success(res, items);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /media:
 *   post:
 *     tags: [Media]
 *     summary: Create media (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId, url]
 *             properties:
 *               playerId:
 *                 type: integer
 *                 example: 6
 *               url:
 *                 type: string
 *                 example: "/uploads/test.jpg"
 *               type:
 *                 type: string
 *                 example: "image"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 example: "Player photo"
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found (FK)
 */
router.post("/", auth, isAdmin, async (req, res, next) => {
  try {
    const playerId = Number(req.body?.playerId);
    const url = String(req.body?.url || "").trim();
    const type = String(req.body?.type || "image").trim();
    const title =
      req.body?.title !== undefined ? String(req.body.title).trim() : null;

    if (!Number.isFinite(playerId))
      return error(res, "playerId must be a number", 400);
    if (!url) return error(res, "url is required", 400);
    if (!type) return error(res, "type is required", 400);

    const created = await prisma.media.create({
      data: {
        playerId,
        url,
        type,
        title: title || null,
      },
    });

    return success(res, created, 201);
  } catch (err) {
    // FK constraint -> playerId not found
    if (isPrismaErr(err, "P2003")) {
      return error(res, "Player not found", 404);
    }
    next(err);
  }
});

/**
 * @openapi
 * /media/{id}:
 *   put:
 *     tags: [Media]
 *     summary: Update media (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "Any of these fields (at least one) can be updated"
 *             properties:
 *               playerId:
 *                 type: integer
 *                 example: 6
 *               url:
 *                 type: string
 *                 example: "/uploads/new.jpg"
 *               type:
 *                 type: string
 *                 example: "image"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 example: "Updated title"
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found (media or player)
 */
router.put("/:id", auth, isAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid id", 400);

    const exists = await prisma.media.findUnique({ where: { id } });
    if (!exists) return error(res, "Media not found", 404);

    const data = {};

    if (req.body?.playerId !== undefined) {
      const playerId = Number(req.body.playerId);
      if (!Number.isFinite(playerId))
        return error(res, "playerId must be a number", 400);
      data.playerId = playerId;
    }

    if (req.body?.url !== undefined) {
      const url = String(req.body.url || "").trim();
      if (!url) return error(res, "url cannot be empty", 400);
      data.url = url;
    }

    if (req.body?.type !== undefined) {
      const type = String(req.body.type || "").trim();
      if (!type) return error(res, "type cannot be empty", 400);
      data.type = type;
    }

    if (req.body?.title !== undefined) {
      const title = String(req.body.title || "").trim();
      data.title = title ? title : null;
    }

    if (Object.keys(data).length === 0) {
      return error(res, "Nothing to update", 400);
    }

    const updated = await prisma.media.update({
      where: { id },
      data,
    });

    return success(res, updated);
  } catch (err) {
    if (isPrismaErr(err, "P2025")) {
      return error(res, "Media not found", 404);
    }
    if (isPrismaErr(err, "P2003")) {
      return error(res, "Player not found", 404);
    }
    next(err);
  }
});

/**
 * @openapi
 * /media/{id}:
 *   delete:
 *     tags: [Media]
 *     summary: Delete media (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 3
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete("/:id", auth, isAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid id", 400);

    const exists = await prisma.media.findUnique({ where: { id } });
    if (!exists) return error(res, "Media not found", 404);

    await prisma.media.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (isPrismaErr(err, "P2025")) {
      return error(res, "Media not found", 404);
    }
    next(err);
  }
});

module.exports = router;
