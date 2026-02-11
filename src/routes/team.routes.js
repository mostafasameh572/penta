// D:\penta\src\routes\team.routes.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const controller = require("../controllers/team.controller");

// ✅ Admin only
router.get("/", auth, isAdmin, controller.getAllTeams);
router.post("/", auth, isAdmin, controller.createTeam);
router.put("/assign-coach", auth, isAdmin, controller.assignCoachToTeam);

module.exports = router;
