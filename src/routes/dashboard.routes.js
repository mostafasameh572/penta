// D:\penta\src\routes\dashboard.routes.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole.middleware");

const dashboardController = require("../controllers/dashboard.controller");

// ✅ Admin + Coach يقدروا يشوفوا الداشبورد
router.get("/", auth, requireRole("ADMIN", "COACH"), dashboardController.getDashboard);

module.exports = router;
