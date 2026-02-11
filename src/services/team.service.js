// D:\penta\src\services\team.service.js

const prisma = require("../prisma");

async function createTeam(name) {
  if (!name) throw new Error("Team name is required");

  const team = await prisma.team.create({
    data: { name: String(name).trim() },
  });

  return team;
}

async function getAllTeams() {
  return await prisma.team.findMany({
    orderBy: { id: "desc" },
    include: {
      players: { select: { id: true, name: true, fullName: true } },
      users: { select: { id: true, email: true, role: true } },
    },
  });
}

async function assignCoachToTeam(userId, teamId) {
  return await prisma.user.update({
    where: { id: Number(userId) },
    data: { teamId: teamId !== null ? Number(teamId) : null },
    select: { id: true, email: true, role: true, teamId: true, photoUrl: true },
  });
}

module.exports = {
  createTeam,
  getAllTeams,
  assignCoachToTeam,
};
