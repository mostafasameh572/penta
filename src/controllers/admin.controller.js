const prisma = require("../prisma");
const { success, error } = require("../utils/response");

exports.getAllCoaches = async (req, res, next) => {
  try {
    const coaches = await prisma.user.findMany({
      where: { role: "COACH" },
      select: {
        id: true,
        email: true,
        role: true,
        photoUrl: true,
        teamId: true,
        isActive: true,
        team: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { id: "desc" },
    });

    return success(res, coaches);
  } catch (err) {
    next(err);
  }
};

exports.updateCoach = async (req, res, next) => {
  try {
    const coachId = Number(req.params.id);
    const { email, teamId, photoUrl } = req.body;

    const exists = await prisma.user.findUnique({ where: { id: coachId } });
    if (!exists || exists.role !== "COACH") {
      return error(res, "Coach not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id: coachId },
      data: {
        email: email !== undefined ? String(email) : undefined,
        teamId:
          teamId !== undefined ? (teamId === null ? null : Number(teamId)) : undefined,
        photoUrl: photoUrl !== undefined ? (photoUrl ? String(photoUrl) : null) : undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        photoUrl: true,
        teamId: true,
        isActive: true,
        team: { select: { id: true, name: true } },
      },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

exports.deactivateCoach = async (req, res, next) => {
  try {
    const coachId = Number(req.params.id);

    const exists = await prisma.user.findUnique({ where: { id: coachId } });
    if (!exists || exists.role !== "COACH") {
      return error(res, "Coach not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id: coachId },
      data: { isActive: false },
      select: { id: true, email: true, role: true, isActive: true, teamId: true },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

exports.activateCoach = async (req, res, next) => {
  try {
    const coachId = Number(req.params.id);

    const exists = await prisma.user.findUnique({ where: { id: coachId } });
    if (!exists || exists.role !== "COACH") {
      return error(res, "Coach not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id: coachId },
      data: { isActive: true },
      select: { id: true, email: true, role: true, isActive: true, teamId: true },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};
