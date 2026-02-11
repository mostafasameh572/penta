const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getPlayerById(id) {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      category: true,
      positions: {
        include: {
          position: true,
        },
      },
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  return player;
}

module.exports = {
  getPlayerById,
};
