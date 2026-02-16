const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function rimraf(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch (_) {}
}

const prismaClientDir = path.join(process.cwd(), "node_modules", ".prisma");
rimraf(prismaClientDir);

run("npx prisma generate");
