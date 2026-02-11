// src/routes/playerStats.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const requireRole = require("../middleware/requireRole.middleware");

const {
  createPlayerStats,
  updatePlayerStats,
  getPlayerStats,
} = require("../services/playerStats.service");

/**
 * @openapi
 * tags:
 *   - name: PlayerStats
 *     description: Player statistics management
 */

/**
 * @openapi
 * /player-stats/{playerId}:
 *   get:
 *     tags:
 *       - PlayerStats
 *     summary: Get player stats (Admin/Coach)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 6
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.get("/:playerId", auth, requireRole("ADMIN", "COACH"), async (req, res) => {
  try {
    const stats = await getPlayerStats(req.params.playerId);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

/**
 * @openapi
 * /player-stats/{playerId}:
 *   post:
 *     tags:
 *       - PlayerStats
 *     summary: Create player stats (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matches: { type: integer, example: 10 }
 *               goals: { type: integer, example: 3 }
 *               assists: { type: integer, example: 2 }
 *               rating: { type: number, example: 7.8 }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post("/:playerId", auth, isAdmin, async (req, res) => {
  try {
    const stats = await createPlayerStats(req.params.playerId, req.body);
    return res.status(201).json({ success: true, data: stats });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @openapi
 * /player-stats/{playerId}:
 *   put:
 *     tags:
 *       - PlayerStats
 *     summary: Update player stats (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matches: { type: integer, example: 12 }
 *               goals: { type: integer, example: 5 }
 *               assists: { type: integer, example: 3 }
 *               rating: { type: number, example: 8.1 }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Bad request
 */
router.put("/:playerId", auth, isAdmin, async (req, res) => {
  try {
    const stats = await updatePlayerStats(req.params.playerId, req.body);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
