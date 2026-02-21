// src/controllers/auth.controller.js  (أو نفس مسار ملفك الحالي)
const prisma = require("../prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function upperRole(role) {
  return String(role || "").toUpperCase();
}

async function resolveClubId({ clubId, teamId }) {
  // 1) لو clubId متبعت صراحة
  if (clubId !== undefined && clubId !== null && String(clubId).trim() !== "") {
    return Number(clubId);
  }

  // 2) لو teamId موجود: نستخرج clubId من الـ team
  if (teamId !== undefined && teamId !== null && String(teamId).trim() !== "") {
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      select: { id: true, clubId: true },
    });

    if (!team) {
      const err = new Error("Invalid teamId");
      err.status = 400;
      throw err;
    }

    if (!team.clubId) {
      const err = new Error("This team is not linked to a club yet");
      err.status = 400;
      throw err;
    }

    return Number(team.clubId);
  }

  // 3) لا clubId ولا teamId
  return null;
}

exports.register = async (req, res) => {
  try {
    const { email, password, role, teamId, photoUrl, clubId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedRole = upperRole(role || "USER");

    // COACH لازم يكون مربوط بـ team
    if (normalizedRole === "COACH" && (teamId === undefined || teamId === null)) {
      return res.status(400).json({ message: "teamId is required for COACH" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Resolve clubId safely
    const resolvedClubId = await resolveClubId({ clubId, teamId });

    // في Multi-club النظام الصح: المستخدم لازم يبقى تابع لنادي
    // (Phase 1 خليتها required منطقيًا، لكن لو عايزها permissive قولّي)
    if (!resolvedClubId) {
      return res.status(400).json({
        message: "clubId is required (or provide teamId linked to a club)",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: normalizedRole,
        clubId: resolvedClubId,
        teamId: teamId === undefined || teamId === null ? null : Number(teamId),
        photoUrl: photoUrl ? String(photoUrl) : null,
        // isActive default true
      },
      select: {
        id: true,
        email: true,
        role: true,
        clubId: true,
        teamId: true,
        photoUrl: true,
        isActive: true,
      },
    });

    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        teamId: true,
        clubId: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ في Multi-club، لازم المستخدم يبقى له clubId
    if (!user.clubId) {
      return res.status(403).json({ message: "User is not linked to a club yet" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: upperRole(user.role),
        clubId: user.clubId ?? null,
        teamId: user.teamId ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: upperRole(user.role),
        clubId: user.clubId ?? null,
        teamId: user.teamId ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};