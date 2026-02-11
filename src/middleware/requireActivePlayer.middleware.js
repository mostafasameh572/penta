const prisma = require("../prisma");
const { error } = require("../utils/response");

/**
 * يمنع تعديل لاعب isActive=false
 * يستخدم قبل update / stats / delete-soft لو حبيت
 * Admin فقط ممكن يتجاوز؟ (هنا هنمنع على الكل ماعدا activate/deactivate)
 */
module.exports = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return error(res, "Invalid player id", 400);

    const player = await prisma.player.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!player) return error(res, "Player not found", 404);

    if (player.isActive === false) {
      return error(res, "Player is deactivated. Activate first.", 400);
    }

    next();
  } catch (err) {
    next(err);
  }
};
