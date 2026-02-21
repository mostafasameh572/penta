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

function normalizeClubId(clubId) {
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

/**
 * ASSIGN PLAYER TO POSITION
 */
async function assignPlayerToPosition(data) {
  const playerId = toInt(data.playerId, "playerId");
  const positionId = toInt(data.positionId, "positionId");
  const isPrimary = data.isPrimary ?? false;
  const clubId = normalizeClubId(data.clubId);

  // ✅ Club isolation check
  if (clubId) {
    const [player, position] = await Promise.all([
      prisma.player.findFirst({
        where: { id: playerId, clubId },
        select: { id: true },
      }),
      prisma.position.findFirst({
        where: { id: positionId, clubId },
        select: { id: true },
      }),
    ]);

    if (!player) throw httpError(404, "Player not found in this club");
    if (!position) throw httpError(404, "Position not found in this club");
  }

  const exists = await prisma.playerPosition.findFirst({
    where: { playerId, positionId },
    select: { id: true },
  });

  if (exists) {
    throw httpError(409, "Player already assigned to this position");
  }

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
 */
async function getAllPlayerPositions({ role, teamId, clubId } = {}) {
  const r = normRole(role);
  const cid = normalizeClubId(clubId);

  const where = {};

  if (r === "COACH") {
    where.player = {
      teamId: toInt(teamId, "teamId"),
    };
  }

  // ✅ Club isolation
  if (cid) {
    where.player = {
      ...(where.player || {}),
      clubId: cid,
    };
  }

  return prisma.playerPosition.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { id: "desc" },
    include: { position: true, player: true },
  });
}

/**
 * SET PRIMARY POSITION
 */
async function setPrimaryPosition(playerId, positionId, clubId) {
  const pId = toInt(playerId, "playerId");
  const posId = toInt(positionId, "positionId");
  const cid = normalizeClubId(clubId);

  // ✅ Club protection
  if (cid) {
    const player = await prisma.player.findFirst({
      where: { id: pId, clubId: cid },
      select: { id: true },
    });
    if (!player) throw httpError(404, "Player not found in this club");
  }

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
 * UNASSIGN PLAYER FROM POSITION
 */
async function unassignPlayerFromPosition(playerId, positionId, clubId) {
  const pId = toInt(playerId, "playerId");
  const posId = toInt(positionId, "positionId");
  const cid = normalizeClubId(clubId);

  // ✅ Club protection
  if (cid) {
    const player = await prisma.player.findFirst({
      where: { id: pId, clubId: cid },
      select: { id: true },
    });
    if (!player) throw httpError(404, "Player not found in this club");
  }

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