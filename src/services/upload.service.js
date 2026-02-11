// D:\penta\src\services\upload.service.js

const path = require("path");
const multer = require("multer");
const prisma = require("../prisma");
const { error } = require("../utils/response");

/**
 * ✅ Storage
 * - players -> /uploads/players
 * - users   -> /uploads/users
 */
function makeStorage(folderName) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), "uploads", folderName));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
      const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
      cb(null, name);
    },
  });
}

function imageOnlyFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only JPG/PNG/WEBP images are allowed"));
  cb(null, true);
}

function makeUploader(folderName) {
  return multer({
    storage: makeStorage(folderName),
    fileFilter: imageOnlyFilter,
    limits: {
      fileSize: 3 * 1024 * 1024, // 3MB
    },
  }).single("photo");
}

async function runUpload(req, res, uploader) {
  return new Promise((resolve, reject) => {
    uploader(req, res, (err) => {
      if (err) return reject(err);
      if (!req.file) return reject(new Error("No file uploaded. Use field name: photo"));
      resolve(req.file);
    });
  });
}

/**
 * ✅ Player photo upload
 */
exports.uploadPlayerPhoto = async (req, playerId) => {
  const uploader = makeUploader("players");
  const file = await runUpload(req, { status: () => ({ json: () => {} }) }, uploader);

  const urlPath = `/uploads/players/${file.filename}`;

  const updated = await prisma.player.update({
    where: { id: Number(playerId) },
    data: { photoUrl: urlPath },
    include: { team: true, stats: true },
  });

  return {
    message: "Player photo uploaded successfully",
    photoUrl: urlPath,
    player: updated,
  };
};

/**
 * ✅ User photo upload (coach/admin)
 */
exports.uploadUserPhoto = async (req, userId) => {
  const uploader = makeUploader("users");
  const file = await runUpload(req, { status: () => ({ json: () => {} }) }, uploader);

  const urlPath = `/uploads/users/${file.filename}`;

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { photoUrl: urlPath },
    select: { id: true, email: true, role: true, teamId: true, photoUrl: true, isActive: true },
  });

  return {
    message: "User photo uploaded successfully",
    photoUrl: urlPath,
    user: updated,
  };
};
