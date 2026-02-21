// src/services/position.service.js
const prisma = require("../prisma");

function normalizeClubId(clubId) {
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

function calcScore(stats) {
  const goals = Number(stats?.goals ?? 0);
  const assists = Number(stats?.assists ?? 0);
  const rating = Number(stats?.rating ?? 0);
  const matches = Number(stats?.matches ?? 0);

  return goals * 4 + assists * 3 + rating * 2 + matches * 0.5;
}

async function getBestPlayerByPosition(positionId, clubId) {
  const posId = Number(positionId);
  if (!Number.isFinite(posId)) return null;

  const cid = normalizeClubId(clubId);

  const links = await prisma.playerPosition.findMany({
    where: {
      positionId: posId,
      ...(cid && {
        player: {
          clubId: cid,
        },
      }),
    },
    include: {
      player: { include: { stats: true } },
    },
  });

  if (!links.length) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const link of links) {
    const player = link.player;
    const stats = player?.stats;
    if (!stats) continue;

    const score = calcScore(stats);

    if (score > bestScore) {
      bestScore = score;
      best = { positionId: posId, score, player, stats };
    }
  }

  return best || null;
}

module.exports = { getBestPlayerByPosition };