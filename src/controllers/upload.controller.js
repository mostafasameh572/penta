// D:\penta\src\controllers\upload.controller.js

const prisma = require("../prisma");
const { success, error } = require("../utils/response");
const { uploadPlayerPhoto, uploadUserPhoto } = require("../services/upload.service");

exports.uploadPlayerPhoto = async (req, res, next) => {
  try {
    const playerId = Number(req.params.playerId);

    const exists = await prisma.player.findUnique({ where: { id: playerId } });
    if (!exists) return error(res, "Player not found", 404);

    const result = await uploadPlayerPhoto(req, playerId);

    return success(res, result, 200);
  } catch (err) {
    next(err);
  }
};

exports.uploadUserPhoto = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);

    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) return error(res, "User not found", 404);

    const result = await uploadUserPhoto(req, userId);

    return success(res, result, 200);
  } catch (err) {
    next(err);
  }
};
