// D:\penta\prisma\backfill-norm.js

const prisma = require("../src/prisma");

function norm(v) {
  return (v ?? "").toString().trim().toLowerCase();
}

async function main() {
  const players = await prisma.player.findMany({
    select: { id: true, name: true, fullName: true, nameNorm: true, fullNameNorm: true },
  });

  let updated = 0;

  for (const p of players) {
    const nextNameNorm = norm(p.name);
    const nextFullNameNorm = norm(p.fullName);

    // update only if missing or wrong
    if (p.nameNorm !== nextNameNorm || p.fullNameNorm !== nextFullNameNorm) {
      await prisma.player.update({
        where: { id: p.id },
        data: {
          nameNorm: nextNameNorm,
          fullNameNorm: nextFullNameNorm,
        },
      });
      updated++;
    }
  }

  console.log(`✅ Backfill finished. Updated players: ${updated}/${players.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
