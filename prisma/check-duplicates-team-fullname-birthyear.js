// D:\penta\prisma\check-duplicates-team-fullname-birthyear.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.player.groupBy({
    by: ["teamId", "fullNameNorm", "birthYear"],

    where: {
      teamId: { not: null },
      fullNameNorm: { not: "" },
    },

    // بنحسب عدد الـ id في كل جروب
    _count: {
      id: true,
    },

    // لو عدد الـ id أكبر من 1 يبقى في تكرار
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (!rows.length) {
    console.log(
      "✅ No duplicates found for (teamId + fullNameNorm + birthYear). Safe to migrate."
    );
    return;
  }

  console.log("⚠️ Duplicates found (teamId + fullNameNorm + birthYear):");

  for (const r of rows) {
    console.log(
      `- teamId=${r.teamId} fullNameNorm="${r.fullNameNorm}" birthYear=${r.birthYear} count=${r._count.id}`
    );

    const players = await prisma.player.findMany({
      where: {
        teamId: r.teamId,
        fullNameNorm: r.fullNameNorm,
        birthYear: r.birthYear,
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        nameNorm: true,
        fullNameNorm: true,
        birthYear: true,
        teamId: true,
        shirtNumber: true,
        createdAt: true,
      },
      orderBy: { id: "asc" },
    });

    console.table(players);
  }

  console.log(
    "\n✅ الحل: احذف/عدّل النسخ المكررة (بالـ curl) ثم شغّل الفحص تاني لحد ما يبقى Safe."
  );
}

main()
  .catch((e) => {
    console.error("❌ Script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
