const express = require("express");
const router = express.Router();

const prisma = require("../prisma");
const requireRole = require("../middleware/requireRole.middleware");
const validate = require("../middleware/validate.middleware");
const { success, error } = require("../utils/response");

// هنستعمل نفس schema بتاع GET /players/:id (params.id number)
const playerSchemas = require("../validators/player.schema");

/**
 * @openapi
 * tags:
 *   - name: PlayerProfile
 *     description: Player full profile (category + positions)
 */

/**
 * @openapi
 * /players/{id}/profile:
 *   get:
 *     tags: [PlayerProfile]
 *     summary: Get player full profile (Admin/Coach)
 *     description: Returns player with category and positions (including position details).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 6
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid player id }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Player not found }
 */
router.get(
  "/:id/profile",
  requireRole("ADMIN", "COACH"),
  validate(playerSchemas.getByIdSchema),
  async (req, res, next) => {
    try {
      const playerId = req.params.id; // ✅ number بعد validate (z.coerce)
      const role = req.user?.role;
      const coachTeamId = req.user?.teamId ?? null;

      // ✅ safety: coach لازم يكون له teamId
      if (role === "COACH" && !coachTeamId) {
        return error(res, "Coach has no team assigned", 403);
      }

      const where = { id: playerId };

      // ✅ Coach scope: نفس منطق getPlayerById
      if (role === "COACH") {
        where.teamId = coachTeamId;
        where.isActive = true;
      }

      const player = await prisma.player.findFirst({
        where,
        include: {
          category: true,
          team: true,
          stats: true,
          positions: {
            include: { position: true },
            orderBy: { id: "asc" },
          },
        },
      });

      if (!player) return error(res, "Player not found", 404);

      // ✅ optional: primaryPosition جاهزة للـ UI
      const primaryLink = Array.isArray(player.positions)
        ? player.positions.find((p) => p.isPrimary)
        : null;

      const primaryPosition = primaryLink?.position || null;

      return success(res, { ...player, primaryPosition });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
