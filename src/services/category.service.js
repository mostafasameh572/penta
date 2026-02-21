// src/services/category.service.js
const prisma = require("../prisma");

function normalizeClubId(clubId) {
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

/**
 * CREATE CATEGORY
 * ✅ attaches clubId if provided (Phase 2A)
 */
async function createCategory({ name, clubId }) {
  if (!name) {
    const err = new Error("Category name is required");
    err.status = 400;
    throw err;
  }

  const cid = normalizeClubId(clubId);

  return prisma.category.create({
    data: {
      name: String(name).trim(),
      clubId: cid ?? null,
    },
  });
}

/**
 * GET ALL CATEGORIES
 * ✅ isolates by clubId if provided
 */
async function getAllCategories({ clubId } = {}) {
  const cid = normalizeClubId(clubId);

  return prisma.category.findMany({
    where: cid ? { clubId: cid } : undefined,
    include: { players: true },
    orderBy: { id: "desc" },
  });
}

/**
 * ASSIGN PLAYER TO CATEGORY
 * ✅ cross-club protection if clubId provided
 */
async function assignPlayerToCategory({ playerId, categoryId, clubId }) {
  const cid = normalizeClubId(clubId);

  const pid = Number(playerId);
  const catId = Number(categoryId);

  if (!Number.isFinite(pid)) {
    const err = new Error("playerId must be a number");
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(catId)) {
    const err = new Error("categoryId must be a number");
    err.status = 400;
    throw err;
  }

  // ✅ If club mode: ensure player & category belong to same club
  if (cid) {
    const [player, category] = await Promise.all([
      prisma.player.findFirst({
        where: { id: pid, clubId: cid },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: { id: catId, clubId: cid },
        select: { id: true },
      }),
    ]);

    if (!player) {
      const err = new Error("Player not found in this club");
      err.status = 404;
      throw err;
    }
    if (!category) {
      const err = new Error("Category not found in this club");
      err.status = 404;
      throw err;
    }
  }

  return prisma.player.update({
    where: { id: pid },
    data: { categoryId: catId },
  });
}

module.exports = {
  createCategory,
  getAllCategories,
  assignPlayerToCategory,
};