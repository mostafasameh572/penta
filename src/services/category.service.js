const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE CATEGORY
 */
async function createCategory(name) {
  return await prisma.category.create({
    data: { name },
  });
}

/**
 * GET ALL CATEGORIES
 */
async function getAllCategories() {
  return await prisma.category.findMany({
    include: { players: true },
  });
}

/**
 * ASSIGN PLAYER TO CATEGORY
 */
async function assignPlayerToCategory(playerId, categoryId) {
  return await prisma.player.update({
    where: { id: Number(playerId) },
    data: { categoryId: Number(categoryId) },
  });
}

module.exports = {
  createCategory,
  getAllCategories,
  assignPlayerToCategory,
};
