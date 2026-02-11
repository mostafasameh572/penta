const prisma = require("../prisma");

async function logEvent({ type, playerId = null, source = "SYSTEM", payload = null }) {
  return await prisma.eventLog.create({
    data: {
      type,
      playerId: playerId !== null ? Number(playerId) : null,
      source,
      payload: payload ? JSON.stringify(payload) : null,
    },
  });
}

module.exports = {
  logEvent,
};
