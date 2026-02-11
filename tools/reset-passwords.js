require("dotenv").config();
const prisma = require("../src/prisma");
const bcrypt = require("bcryptjs");

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@penta.com";
  const coachEmail = process.env.COACH_EMAIL || "coach@penta.com";

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const coachPassword = process.env.COACH_PASSWORD || "coach123456";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const coachHash = await bcrypt.hash(coachPassword, 10);

  const admin = await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { password: adminHash },
  });

  const coach = await prisma.user.updateMany({
    where: { email: coachEmail },
    data: { password: coachHash },
  });

  console.log("✅ Passwords updated");
  console.log({ adminEmail, adminUpdated: admin.count });
  console.log({ coachEmail, coachUpdated: coach.count });
}

run()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect().finally(() => process.exit(1));
  });
