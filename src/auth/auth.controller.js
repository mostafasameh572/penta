const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password, // 🔴 هنشفّر بعدين
        role: role || "USER"
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
