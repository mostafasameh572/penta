// D:\penta\prisma\check-duplicates.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // نجمع اللاعبين حسب (teamId + shirtNumber)
  const rows = await prisma.player.groupBy({
    by: ["teamId", "shirtNumber"],
    _count: { _all: true },
  });

  const dups = rows.filter((r) => r.teamId !== null && r._count._all > 1);

  if (!dups.length) {
    console.log("✅ No duplicates found for (teamId + shirtNumber). Safe to migrate.");
    return;
  }

  console.log("⚠️ Duplicates found (teamId + shirtNumber):");
  for (const d of dups) {
    console.log(`- teamId=${d.teamId} shirtNumber=${d.shirtNumber} count=${d._count._all}`);

    const players = await prisma.player.findMany({
      where: { teamId: d.teamId, shirtNumber: d.shirtNumber },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, fullName: true, createdAt: true, teamId: true, shirtNumber: true },
    });

    console.table(players);
  }

  console.log("\n✅ الحل: احذف/عدّل النسخ المكررة (بالـ curl) ثم شغّل الفحص تاني لحد ما يبقى Safe.");
}

main()
  .catch((e) => {
    console.error("❌ ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
