// tools/test-reset-db.js
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  console.log("\n🧪 Preparing TEST database...");
  console.log(`✅ Using DATABASE_URL=${process.env.DATABASE_URL}`);

  // لازم DATABASE_URL يبقى موجود (جاي من package.json)
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing. Did you run via npm test?");
    process.exit(1);
  }

  run("npx prisma migrate reset --force --skip-generate");

  console.log("\n✅ Test DB ready.\n");
}

main();
