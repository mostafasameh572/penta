// src/services/team.service.js
const prisma = require("../prisma");

function normalizeClubId(clubId) {
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

async function createTeam({ name, clubId }) {
  if (!name) throw new Error("Team name is required");

  const cid = normalizeClubId(clubId);

  const team = await prisma.team.create({
    data: {
      name: String(name).trim(),
      // ✅ attach clubId if provided (Phase 2A)
      clubId: cid ?? null,
    },
  });

  return team;
}

async function getAllTeams({ clubId } = {}) {
  const cid = normalizeClubId(clubId);

  return prisma.team.findMany({
    where: cid ? { clubId: cid } : undefined, // ✅ isolate if we have clubId
    orderBy: { id: "desc" },
    include: {
      players: { select: { id: true, name: true, fullName: true } },
      users: { select: { id: true, email: true, role: true } },
    },
  });
}

async function assignCoachToTeam({ userId, teamId, clubId }) {
  const cid = normalizeClubId(clubId);

  const uid = Number(userId);
  if (!Number.isFinite(uid)) {
    const err = new Error("userId must be a number");
    err.status = 400;
    throw err;
  }

  // teamId ممكن يكون null لفك الربط
  const tid = teamId !== null && teamId !== undefined ? Number(teamId) : null;
  if (tid !== null && !Number.isFinite(tid)) {
    const err = new Error("teamId must be a number or null");
    err.status = 400;
    throw err;
  }

  // ✅ If we are in club mode, prevent cross-club assignment
  if (cid) {
    // 1) user must belong to same club
    const user = await prisma.user.findFirst({
      where: { id: uid, clubId: cid },
      select: { id: true },
    });
    if (!user) {
      const err = new Error("User not found in this club");
      err.status = 404;
      throw err;
    }

    // 2) if assigning to a team, team must belong to same club
    if (tid !== null) {
      const team = await prisma.team.findFirst({
        where: { id: tid, clubId: cid },
        select: { id: true },
      });
      if (!team) {
        const err = new Error("Team not found in this club");
        err.status = 404;
        throw err;
      }
    }
  }

  return prisma.user.update({
    where: { id: uid },
    data: { teamId: tid },
    select: { id: true, email: true, role: true, clubId: true, teamId: true, photoUrl: true },
  });
}

module.exports = {
  createTeam,
  getAllTeams,
  assignCoachToTeam,
};