// D:\penta\src\routes\upload.routes.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const uploadController = require("../controllers/upload.controller");

// ✅ Admin uploads player photo
router.post("/player/:playerId/photo", auth, isAdmin, uploadController.uploadPlayerPhoto);

// ✅ Admin uploads coach/admin photo
router.post("/user/:userId/photo", auth, isAdmin, uploadController.uploadUserPhoto);

module.exports = router;
