const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE STATS
async function createPlayerStats(playerId, data) {
  return await prisma.playerStats.create({
    data: {
      playerId: Number(playerId),
      ...data,
    },
  });
}

// UPDATE STATS
async function updatePlayerStats(playerId, data) {
  return await prisma.playerStats.update({
    where: { playerId: Number(playerId) },
    data,
  });
}

// GET STATS
async function getPlayerStats(playerId) {
  return await prisma.playerStats.findUnique({
    where: { playerId: Number(playerId) },
  });
}

module.exports = {
  createPlayerStats,
  updatePlayerStats,
  getPlayerStats,
};
