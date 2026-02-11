// D:\penta\src\controllers\dashboard.controller.js

const prisma = require("../prisma");
const { success } = require("../utils/response");

exports.getDashboard = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const teamId = req.user?.teamId ?? null;

    // ✅ Admin يشوف الكل
    // ✅ Coach يشوف فريقه فقط
    const playerWhere = {};
    if (role === "COACH") {
      playerWhere.teamId = teamId;
    }

    const [playersCount, teamsCount, latestPlayers, topPlayers] = await Promise.all([
      prisma.player.count({ where: playerWhere }),

      // الكوتش مش لازم يعرف عدد الفرق كلها (بس مش خطر)، هنخليها Admin only
      role === "ADMIN" ? prisma.team.count() : Promise.resolve(null),

      prisma.player.findMany({
        where: playerWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { team: true, stats: true },
      }),

      prisma.player.findMany({
        where: playerWhere,
        orderBy: [
          { stats: { rating: "desc" } }, // لو stats موجودة
          { createdAt: "desc" },
        ],
        take: 5,
        include: { team: true, stats: true },
      }),
    ]);

    return success(res, {
      scope: role === "COACH" ? { role, teamId } : { role: "ADMIN" },
      kpis: {
        playersCount,
        teamsCount,
      },
      latestPlayers,
      topPlayers,
    });
  } catch (err) {
    next(err);
  }
};
