const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const controller = require("../controllers/admin.controller");

router.get("/coaches", auth, isAdmin, controller.getAllCoaches);
router.put("/coaches/:id", auth, isAdmin, controller.updateCoach);

// ✅ deactivate / activate
router.put("/coaches/:id/deactivate", auth, isAdmin, controller.deactivateCoach);
router.put("/coaches/:id/activate", auth, isAdmin, controller.activateCoach);

module.exports = router;
