const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET FULL PLAYER PROFILE
 */
async function getPlayerProfile(playerId) {
  const player = await prisma.player.findUnique({
    where: { id: Number(playerId) },
    include: {
      category: true,
      positions: {
        include: {
          position: true,
        },
      },
      contracts: true,
      media: true,
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  const primaryPosition = player.positions.find(p => p.isPrimary);

  return {
    id: player.id,
    fullName: player.fullName,
    shirtNumber: player.shirtNumber,
    birthYear: player.birthYear,
    contractStart: player.contractStart,
    contractEnd: player.contractEnd,
    category: player.category,
    primaryPosition: primaryPosition
      ? primaryPosition.position
      : null,
    positions: player.positions.map(p => ({
      id: p.position.id,
      code: p.position.code,
      name: p.position.name,
      isPrimary: p.isPrimary,
    })),
    contracts: player.contracts,
    media: player.media,
  };
}

module.exports = {
  getPlayerProfile,
};
