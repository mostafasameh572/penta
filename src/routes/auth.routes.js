// D:\penta\src\routes\auth.routes.js

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication & users management
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login (Public)
 *     description: Returns JWT token on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@penta.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful (returns token)
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many login attempts
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Create user (Admin only)
 *     description: Admin can create users (COACH / ADMIN ...).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "coach@penta.com" }
 *               password: { type: string, example: "123456" }
 *               role:
 *                 type: string
 *                 example: "COACH"
 *               teamId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       201:
 *         description: User created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
router.post("/register", auth, isAdmin, authController.register);

module.exports = router;
