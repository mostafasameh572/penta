// src/services/position.service.js
const prisma = require("../prisma");

function calcScore(stats) {
  const goals = Number(stats?.goals ?? 0);
  const assists = Number(stats?.assists ?? 0);
  const rating = Number(stats?.rating ?? 0);
  const matches = Number(stats?.matches ?? 0);

  const safeGoals = Number.isFinite(goals) ? goals : 0;
  const safeAssists = Number.isFinite(assists) ? assists : 0;
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const safeMatches = Number.isFinite(matches) ? matches : 0;

  return safeGoals * 4 + safeAssists * 3 + safeRating * 2 + safeMatches * 0.5;
}

async function getBestPlayerByPosition(positionId) {
  const posId = Number(positionId);
  if (!Number.isFinite(posId)) return null;

  const links = await prisma.playerPosition.findMany({
    where: { positionId: posId },
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
