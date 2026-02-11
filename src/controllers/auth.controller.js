const prisma = require("../prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function upperRole(role) {
  return String(role || "").toUpperCase();
}

exports.register = async (req, res) => {
  try {
    const { email, password, role, teamId, photoUrl } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedRole = upperRole(role || "USER");

    if (normalizedRole === "COACH" && (teamId === undefined || teamId === null)) {
      return res.status(400).json({ message: "teamId is required for COACH" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: normalizedRole,
        teamId:
          teamId === undefined ? null : teamId === null ? null : Number(teamId),
        photoUrl: photoUrl ? String(photoUrl) : null,
        // isActive default true
      },
      select: {
        id: true,
        email: true,
        role: true,
        teamId: true,
        photoUrl: true,
        isActive: true,
      },
    });

    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
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
      select: { id: true, email: true, password: true, role: true, teamId: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ لو متعطل، امنع الدخول
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: upperRole(user.role),
        teamId: user.teamId ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
