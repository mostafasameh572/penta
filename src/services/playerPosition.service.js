// src/services/playerPosition.service.js
const prisma = require("../prisma");

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function toInt(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    throw httpError(400, `${fieldName} must be a number`);
  }
  return n;
}

function normRole(role) {
  return String(role || "ADMIN").toUpperCase();
}

/**
 * ASSIGN PLAYER TO POSITION
 */
async function assignPlayerToPosition(data) {
  const playerId = toInt(data.playerId, "playerId");
  const positionId = toInt(data.positionId, "positionId");
  const isPrimary = data.isPrimary ?? false;

  const exists = await prisma.playerPosition.findFirst({
    where: { playerId, positionId },
    select: { id: true },
  });

  if (exists) {
    throw httpError(409, "Player already assigned to this position");
  }

  // لو isPrimary=true: اقفل الباقي
  if (isPrimary) {
    await prisma.playerPosition.updateMany({
      where: { playerId },
      data: { isPrimary: false },
    });
  }

  return prisma.playerPosition.create({
    data: { playerId, positionId, isPrimary },
  });
}

/**
 * GET ALL (ADMIN / COACH)
 * - ADMIN: all
 * - COACH: only positions for players in his team
 */
async function getAllPlayerPositions({ role, teamId } = {}) {
  const r = normRole(role);

  const where =
    r === "COACH"
      ? {
          player: {
            teamId: toInt(teamId, "teamId"),
          },
        }
      : undefined;

  return prisma.playerPosition.findMany({
    where,
    orderBy: { id: "desc" },
    include: { position: true, player: true },
  });
}

/**
 * SET PRIMARY POSITION
 */
async function setPrimaryPosition(playerId, positionId) {
  const pId = toInt(playerId, "playerId");
  const posId = toInt(positionId, "positionId");

  const rel = await prisma.playerPosition.findUnique({
    where: {
      playerId_positionId: {
        playerId: pId,
        positionId: posId,
      },
    },
    select: { id: true },
  });

  if (!rel) {
    throw httpError(404, "Player is not assigned to this position");
  }

  await prisma.playerPosition.updateMany({
    where: { playerId: pId },
    data: { isPrimary: false },
  });

  return prisma.playerPosition.update({
    where: {
      playerId_positionId: {
        playerId: pId,
        positionId: posId,
      },
    },
    data: { isPrimary: true },
  });
}

/**
 * UNASSIGN PLAYER FROM POSITION (by playerId + positionId)
 * Production rule:
 * - لو العلاقة primary AND في علاقات تانية موجودة => 409 لازم يحدد primary جديد الأول
 * - لو primary ومافيش غيرها => عادي نحذف وتبقى primaryPosition=null
 */
async function unassignPlayerFromPosition(playerId, positionId) {
  const pId = toInt(playerId, "playerId");
  const posId = toInt(positionId, "positionId");

  const rel = await prisma.playerPosition.findUnique({
    where: {
      playerId_positionId: {
        playerId: pId,
        positionId: posId,
      },
    },
    select: { id: true, isPrimary: true },
  });

  if (!rel) {
    throw httpError(404, "Player is not assigned to this position");
  }

  // ✅ لو primary: شوف هل في غيرها لنفس اللاعب؟
  if (rel.isPrimary) {
    const othersCount = await prisma.playerPosition.count({
      where: {
        playerId: pId,
        NOT: { positionId: posId },
      },
    });

    if (othersCount > 0) {
      throw httpError(
        409,
        "Cannot unassign primary position. Set another primary first."
      );
    }
  }

  await prisma.playerPosition.delete({
    where: {
      playerId_positionId: {
        playerId: pId,
        positionId: posId,
      },
    },
  });

  return { message: "Player unassigned from position" };
}

module.exports = {
  assignPlayerToPosition,
  getAllPlayerPositions,
  setPrimaryPosition,
  unassignPlayerFromPosition,
};
