// D:\penta\prisma\check-player-identity-duplicates.js
const prisma = require("../src/prisma");

async function main() {
  const rows = await prisma.player.findMany({
    select: { id: true, fullNameNorm: true, birthYear: true, teamId: true, createdAt: true, fullName: true },
  });

  const map = new Map();
  for (const r of rows) {
    const key = `${r.teamId ?? "null"}|${r.fullNameNorm}|${r.birthYear}`;
    map.set(key, (map.get(key) || 0) + 1);
  }

  const dups = [];
  for (const [key, count] of map.entries()) {
    if (count > 1) dups.push({ key, count });
  }

  if (!dups.length) {
    console.log("✅ No duplicates found for (teamId + fullNameNorm + birthYear). Safe to migrate.");
    return;
  }

  console.log("⚠️ Duplicates found (teamId + fullNameNorm + birthYear):");
  for (const d of dups) {
    const [teamId, fullNameNorm, birthYear] = d.key.split("|");
    console.log(`- teamId=${teamId} fullNameNorm=${fullNameNorm} birthYear=${birthYear} count=${d.count}`);

    const list = await prisma.player.findMany({
      where: {
        teamId: teamId === "null" ? null : Number(teamId),
        fullNameNorm,
        birthYear: Number(birthYear),
      },
      select: { id: true, fullName: true, fullNameNorm: true, birthYear: true, teamId: true, createdAt: true },
      orderBy: { id: "asc" },
    });

    console.table(list);
  }

  console.log("\n✅ الحل: احذف/عدّل النسخ المكررة (بالـ curl) ثم شغّل الفحص تاني لحد ما يبقى Safe.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
