// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

// ============ Club ============
async function upsertClub(name) {
  return prisma.club.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

// ============ Team / Category (now unique inside club) ============
async function upsertTeam({ clubId, name }) {
  return prisma.team.upsert({
    where: {
      clubId_name: {
        clubId,
        name,
      },
    },
    update: {},
    create: { name, clubId },
  });
}

async function upsertCategory({ clubId, name }) {
  return prisma.category.upsert({
    where: {
      clubId_name: {
        clubId,
        name,
      },
    },
    update: {},
    create: { name, clubId },
  });
}

// ============ Position (global) ============
async function upsertPosition(name) {
  return prisma.position.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

// ============ Users ============
async function upsertUser({ email, password, role, teamId, clubId }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role,
      teamId: teamId ?? null,
      clubId: clubId ?? null,
      isActive: true,
    },
    create: {
      email,
      password: hash,
      role,
      teamId: teamId ?? null,
      clubId: clubId ?? null,
      isActive: true,
    },
  });
}

// ============ Players ============
async function upsertPlayer({
  clubId,
  teamId,
  categoryId,
  name,
  fullName,
  positionLegacy,
  shirtNumber,
  birthYear,
  photoUrl,
}) {
  const dataCommon = {
    clubId: clubId ?? null,
    name,
    fullName,
    nameNorm: norm(name),
    fullNameNorm: norm(fullName),
    position: positionLegacy,
    shirtNumber: Number(shirtNumber),
    birthYear: Number(birthYear),
    teamId: teamId ?? null,
    categoryId: categoryId ?? null,
    photoUrl: photoUrl ?? null,
    isActive: true,
  };

  // ✅ CASE 1: teamId موجود => نستخدم compound unique الجديد
  if (teamId !== null && teamId !== undefined) {
    return prisma.player.upsert({
      where: {
        clubId_teamId_fullNameNorm_birthYear: {
          clubId: Number(clubId),
          teamId: Number(teamId),
          fullNameNorm: norm(fullName),
          birthYear: Number(birthYear),
        },
      },
      update: dataCommon,
      create: dataCommon,
    });
  }

  // ✅ CASE 2: teamId = null => نعمل findFirst داخل نفس النادي
  const existing = await prisma.player.findFirst({
    where: {
      clubId: Number(clubId),
      teamId: null,
      fullNameNorm: norm(fullName),
      birthYear: Number(birthYear),
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.player.update({
      where: { id: existing.id },
      data: dataCommon,
    });
  }

  return prisma.player.create({ data: dataCommon });
}

// ============ Stats ============
async function upsertStats(playerId, stats) {
  return prisma.playerStats.upsert({
    where: { playerId },
    update: {
      matches: Number(stats.matches ?? 0),
      goals: Number(stats.goals ?? 0),
      assists: Number(stats.assists ?? 0),
      rating: Number(stats.rating ?? 0),
      source: stats.source ?? "manual",
    },
    create: {
      playerId,
      matches: Number(stats.matches ?? 0),
      goals: Number(stats.goals ?? 0),
      assists: Number(stats.assists ?? 0),
      rating: Number(stats.rating ?? 0),
      source: stats.source ?? "manual",
    },
  });
}

// ============ PlayerPosition ============
async function upsertPlayerPosition(playerId, positionId, isPrimary = false) {
  const link = await prisma.playerPosition.upsert({
    where: {
      playerId_positionId: {
        playerId,
        positionId,
      },
    },
    update: {
      isPrimary: Boolean(isPrimary),
    },
    create: {
      playerId,
      positionId,
      isPrimary: Boolean(isPrimary),
    },
  });

  if (isPrimary) {
    await prisma.playerPosition.updateMany({
      where: { playerId, NOT: { positionId } },
      data: { isPrimary: false },
    });
  }

  return link;
}

// ============ Media ============
async function createMediaIfNotExists({ playerId, type, url, title }) {
  const existing = await prisma.media.findFirst({
    where: { playerId, type, url, title: title ?? null },
  });
  if (existing) return existing;

  return prisma.media.create({
    data: {
      playerId,
      type: type ?? "image",
      url,
      title: title ?? null,
    },
  });
}

async function main() {
  // 0) Club (Tenant)
  const club = await upsertClub("Penta Demo Club");

  // 1) Teams (inside club)
  const team2007 = await upsertTeam({ clubId: club.id, name: "2007" });
  const team2008 = await upsertTeam({ clubId: club.id, name: "2008" });

  // 2) Categories (inside club)
  const catU16 = await upsertCategory({ clubId: club.id, name: "U16" });
  const catU17 = await upsertCategory({ clubId: club.id, name: "U17" });

  // 3) Positions (global)
  const posGK = await upsertPosition("GK");
  const posCB = await upsertPosition("CB");
  const posCM = await upsertPosition("CM");
  const posST = await upsertPosition("ST");
  const posRW = await upsertPosition("RW");

  // 4) Users (inside club)
  const admin = await upsertUser({
    email: "admin@penta.com",
    password: "123456",
    role: "ADMIN",
    teamId: null,
    clubId: club.id,
  });

  const coach2007 = await upsertUser({
    email: "coach@penta.com",
    password: "123456",
    role: "COACH",
    teamId: team2007.id,
    clubId: club.id,
  });

  // 5) Players (inside club)
  const p1 = await upsertPlayer({
    clubId: club.id,
    teamId: team2007.id,
    categoryId: catU16.id,
    name: "Ali",
    fullName: "Ali Ahmed",
    positionLegacy: "CM",
    shirtNumber: 8,
    birthYear: 2007,
    photoUrl: "https://example.com/ali.jpg",
  });

  const p2 = await upsertPlayer({
    clubId: club.id,
    teamId: team2008.id,
    categoryId: catU17.id,
    name: "Kareem",
    fullName: "Kareem Ali",
    positionLegacy: "CB",
    shirtNumber: 5,
    birthYear: 2008,
    photoUrl: null,
  });

  // ✅ player بدون فريق (Free agent) لكن داخل نفس النادي
  const p3 = await upsertPlayer({
    clubId: club.id,
    teamId: null,
    categoryId: null,
    name: "Test",
    fullName: "Test Player",
    positionLegacy: "CM",
    shirtNumber: 8,
    birthYear: 2003,
    photoUrl: null,
  });

  // 6) Stats
  await upsertStats(p1.id, { matches: 12, goals: 3, assists: 4, rating: 7.9, source: "manual" });
  await upsertStats(p2.id, { matches: 10, goals: 1, assists: 1, rating: 7.2, source: "manual" });
  await upsertStats(p3.id, { matches: 15, goals: 6, assists: 4, rating: 8.2, source: "manual" });

  // 7) PlayerPositions + primary
  await upsertPlayerPosition(p1.id, posCM.id, true);
  await upsertPlayerPosition(p1.id, posRW.id, false);
  await upsertPlayerPosition(p2.id, posCB.id, true);
  await upsertPlayerPosition(p3.id, posGK.id, true);

  // 8) Media sample
  await createMediaIfNotExists({
    playerId: p3.id,
    type: "image",
    url: "/uploads/test.jpg",
    title: "Player photo",
  });

  console.log("✅ Seed ready:", {
    club: club.name,
    teams: [team2007.name, team2008.name],
    categories: [catU16.name, catU17.name],
    positions: ["GK", "CB", "CM", "ST", "RW"],
    users: { admin: admin.email, coach: coach2007.email },
    players: [p1.id, p2.id, p3.id],
  });
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });