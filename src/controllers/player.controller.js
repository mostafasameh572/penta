// src/controllers/player.controller.js
const prisma = require("../prisma");
const { success, error } = require("../utils/response");
const { logEvent } = require("../services/event.service");

// ✅ helper: normalize
function norm(v) {
  return String(v || "").trim().toLowerCase();
}

// ✅ Prisma unique error (P2002)
function isPrismaUniqueErr(err) {
  return err && err.code === "P2002";
}

// ✅ Try to understand which unique constraint failed
function uniqueKind(err) {
  const targetRaw = err?.meta?.target; // array | string | undefined
  const metaStr = JSON.stringify(err?.meta || {}).toLowerCase();
  const msgStr = String(err?.message || "").toLowerCase();

  const targetArr = Array.isArray(targetRaw)
    ? targetRaw.map(String)
    : typeof targetRaw === "string"
    ? [targetRaw]
    : [];

  const targetStr = (
    Array.isArray(targetRaw) ? targetRaw.join(",") : String(targetRaw || "")
  ).toLowerCase();

  const hasCols = (...cols) => cols.every((c) => targetArr.includes(c));
  const hasAnyText = (...parts) =>
    parts.every((p) => {
      const x = String(p).toLowerCase();
      return targetStr.includes(x) || metaStr.includes(x) || msgStr.includes(x);
    });

  // 1) (teamId + shirtNumber)
  if (hasCols("teamId", "shirtNumber") || hasAnyText("teamid", "shirtnumber")) {
    return "TEAM_SHIRT";
  }

  // 2) (teamId + fullNameNorm + birthYear)
  if (
    hasCols("teamId", "fullNameNorm", "birthYear") ||
    hasAnyText("teamid", "fullnamenorm", "birthyear")
  ) {
    return "TEAM_NAME_BIRTH";
  }

  return "GENERIC";
}

// ✅ Phase 2A: Club isolation (backward compatible)
// لو token فيه clubId -> نفعل العزل
// لو مفيش clubId (تست/توكن قديم) -> نسيبها null (بدون عزل)
function getClubIdOrNull(req) {
  const clubId = req.user?.clubId;
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET ALL PLAYERS
 * (Admin: all or active only)
 * (Coach: only his team + active only)
 * + ✅ Club isolation if clubId exists
 */
exports.getAllPlayers = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const userTeamId = req.user?.teamId ?? null;
    const clubId = getClubIdOrNull(req);

    // ✅ safety: Coach لازم يكون مربوط بفريق
    if (role === "COACH" && !userTeamId) {
      return error(res, "Coach has no team assigned", 403);
    }

    const search = norm(req.query.search || "");

    const pageRaw = Number(req.query.page || 1);
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;

    const takeRaw = Number(req.query.take || 20);
    const take = Number.isFinite(takeRaw) ? Math.min(50, Math.max(1, takeRaw)) : 20;

    const skip = (page - 1) * take;

    // includeInactive works for ADMIN only
    const includeInactive =
      role === "ADMIN" && String(req.query.includeInactive) === "true";

    let teamIdFilter = null;

    if (role === "ADMIN") {
      if (req.query.teamId !== undefined && req.query.teamId !== "") {
        const t = Number(req.query.teamId);
        if (!Number.isFinite(t)) {
          return error(res, "teamId must be a number", 400);
        }
        teamIdFilter = t;
      }
    } else if (role === "COACH") {
      // ✅ coach scoped to his team only
      teamIdFilter = userTeamId;
    }

    const where = {};

    // ✅ Club scope (if available)
    if (clubId) {
      where.clubId = clubId;
    }

    // ✅ Team scope
    if (teamIdFilter !== null) {
      where.teamId = teamIdFilter;
    }

    // ✅ Active scope
    if (role === "COACH") {
      where.isActive = true;
    } else if (role === "ADMIN") {
      if (!includeInactive) where.isActive = true;
    }

    // ✅ Search (normalized)
    if (search) {
      where.OR = [
        { nameNorm: { contains: search } },
        { fullNameNorm: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take,
        include: {
          stats: true,
          team: true,
          positions: {
            include: { position: true },
          },
        },
      }),
      prisma.player.count({ where }),
    ]);

    // ✅ Shape: add primaryPosition
    const shaped = items.map((p) => {
      const primaryRel = (p.positions || []).find((x) => x.isPrimary);
      return {
        ...p,
        primaryPosition: primaryRel ? primaryRel.position : null,
      };
    });

    return success(res, {
      page,
      take,
      total,
      pages: Math.ceil(total / take),
      items: shaped,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PLAYER BY ID
 * Admin: any
 * Coach: only if same team + active
 * + ✅ Club isolation if clubId exists
 */
exports.getPlayerById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid player id", 400);

    const role = req.user?.role;
    const coachTeamId = req.user?.teamId ?? null;
    const clubId = getClubIdOrNull(req);

    // ✅ safety
    if (role === "COACH" && !coachTeamId) {
      return error(res, "Coach has no team assigned", 403);
    }

    const where = { id };

    // ✅ Club scope
    if (clubId) where.clubId = clubId;

    // ✅ Coach scope in query نفسها (أقوى)
    if (role === "COACH") {
      where.teamId = coachTeamId;
      where.isActive = true;
    }

    const player = await prisma.player.findFirst({
      where,
      include: {
        stats: true,
        team: true,
        positions: {
          include: { position: true },
        },
      },
    });

    if (!player) return error(res, "Player not found", 404);

    // ✅ Shape: add primaryPosition
    const primaryRel = (player.positions || []).find((x) => x.isPrimary);
    const shaped = {
      ...player,
      primaryPosition: primaryRel ? primaryRel.position : null,
    };

    return success(res, shaped);
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE PLAYER (Admin)
 * + ✅ sets clubId if available (recommended)
 */
exports.createPlayer = async (req, res, next) => {
  try {
    const { name, fullName, position, shirtNumber, birthYear, teamId, photoUrl } =
      req.body;

    if (!name || !fullName || !position || !shirtNumber || !birthYear) {
      return error(res, "Missing required fields", 400);
    }

    const clubId = getClubIdOrNull(req);

    const created = await prisma.player.create({
      data: {
        // ✅ attach clubId if we have it (Phase 2A)
        clubId: clubId ?? null,

        name,
        fullName,
        nameNorm: norm(name),
        fullNameNorm: norm(fullName),

        position,
        shirtNumber: Number(shirtNumber),
        birthYear: Number(birthYear),
        teamId:
          teamId !== undefined ? (teamId === null ? null : Number(teamId)) : null,
        photoUrl: photoUrl ? String(photoUrl) : null,
        isActive: true,
      },
      include: { stats: true, team: true },
    });

    await logEvent({
      type: "PLAYER_CREATED",
      playerId: created.id,
      source: req.user?.role || "SYSTEM",
      // ✅ لو eventLog عندك بقى فيه clubId في service هنبعت ده بعدين
      payload: { player: created },
    });

    return success(res, created, 201);
  } catch (err) {
    if (isPrismaUniqueErr(err)) {
      const k = uniqueKind(err);
      if (k === "TEAM_SHIRT")
        return error(res, "Shirt number already exists in this team", 409);
      if (k === "TEAM_NAME_BIRTH")
        return error(
          res,
          "Player already exists in this team (same name and birth year)",
          409
        );
      return error(res, "Duplicate value", 409);
    }
    next(err);
  }
};

/**
 * UPDATE PLAYER (Admin)
 * + ✅ Cross-club protection if clubId exists
 */
exports.updatePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid player id", 400);

    const clubId = getClubIdOrNull(req);

    // ✅ exists check (with club scope if available)
    const exists = await prisma.player.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
      select: { id: true, isActive: true },
    });
    if (!exists) return error(res, "Player not found", 404);

    if (exists.isActive === false) {
      return error(res, "Player is deactivated. Activate first.", 400);
    }

    const data = {
      ...req.body,
      shirtNumber:
        req.body.shirtNumber !== undefined ? Number(req.body.shirtNumber) : undefined,
      birthYear:
        req.body.birthYear !== undefined ? Number(req.body.birthYear) : undefined,
      teamId:
        req.body.teamId !== undefined
          ? req.body.teamId === null
            ? null
            : Number(req.body.teamId)
          : undefined,
      photoUrl:
        req.body.photoUrl !== undefined
          ? req.body.photoUrl
            ? String(req.body.photoUrl)
            : null
          : undefined,
    };

    if (req.body.name !== undefined) data.nameNorm = norm(req.body.name);
    if (req.body.fullName !== undefined) data.fullNameNorm = norm(req.body.fullName);

    // ✅ enforce clubId stays the same (don't allow changing tenant)
    if (data.clubId !== undefined) delete data.clubId;

    const updated = await prisma.player.update({
      where: { id },
      data,
      include: { stats: true, team: true },
    });

    await logEvent({
      type: "PLAYER_UPDATED",
      playerId: updated.id,
      source: req.user?.role || "SYSTEM",
      payload: { changes: req.body, player: updated },
    });

    return success(res, updated);
  } catch (err) {
    if (isPrismaUniqueErr(err)) {
      const k = uniqueKind(err);
      if (k === "TEAM_SHIRT")
        return error(res, "Shirt number already exists in this team", 409);
      if (k === "TEAM_NAME_BIRTH")
        return error(
          res,
          "Player already exists in this team (same name and birth year)",
          409
        );
      return error(res, "Duplicate value", 409);
    }
    next(err);
  }
};

/**
 * DELETE PLAYER (Admin) ✅ Soft Delete
 * + ✅ Cross-club protection if clubId exists
 */
exports.deletePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid player id", 400);

    const clubId = getClubIdOrNull(req);

    const exists = await prisma.player.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
      select: { id: true, isActive: true },
    });
    if (!exists) return error(res, "Player not found", 404);

    if (exists.isActive === false) {
      return success(res, { message: "Player already deactivated" });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: { isActive: false },
      include: { team: true, stats: true },
    });

    await logEvent({
      type: "PLAYER_DEACTIVATED",
      playerId: id,
      source: req.user?.role || "SYSTEM",
      payload: { player: updated },
    });

    return success(res, { message: "Player deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

exports.deactivatePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid player id", 400);

    const clubId = getClubIdOrNull(req);

    const exists = await prisma.player.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
    });
    if (!exists) return error(res, "Player not found", 404);

    const updated = await prisma.player.update({
      where: { id },
      data: { isActive: false },
      include: { team: true, stats: true },
    });

    await logEvent({
      type: "PLAYER_DEACTIVATED",
      playerId: id,
      source: req.user?.role || "SYSTEM",
      payload: { player: updated },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

exports.activatePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return error(res, "Invalid player id", 400);

    const clubId = getClubIdOrNull(req);

    const exists = await prisma.player.findFirst({
      where: {
        id,
        ...(clubId ? { clubId } : {}),
      },
    });
    if (!exists) return error(res, "Player not found", 404);

    const updated = await prisma.player.update({
      where: { id },
      data: { isActive: true },
      include: { team: true, stats: true },
    });

    await logEvent({
      type: "PLAYER_ACTIVATED",
      playerId: id,
      source: req.user?.role || "SYSTEM",
      payload: { player: updated },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

exports.updatePlayerStats = async (req, res, next) => {
  try {
    const playerId = Number(req.params.id);
    if (!Number.isFinite(playerId)) return error(res, "Invalid player id", 400);

    const clubId = getClubIdOrNull(req);

    const exists = await prisma.player.findFirst({
      where: {
        id: playerId,
        ...(clubId ? { clubId } : {}),
      },
      select: { id: true, isActive: true },
    });
    if (!exists) return error(res, "Player not found", 404);

    if (exists.isActive === false) {
      return error(res, "Player is deactivated. Activate first.", 400);
    }

    const { matches, goals, assists, rating, source } = req.body;

    const stats = await prisma.playerStats.upsert({
      where: { playerId },
      update: {
        matches: matches !== undefined ? Number(matches) : undefined,
        goals: goals !== undefined ? Number(goals) : undefined,
        assists: assists !== undefined ? Number(assists) : undefined,
        rating: rating !== undefined ? Number(rating) : undefined,
        source: source !== undefined ? String(source) : undefined,
      },
      create: {
        playerId,
        matches: matches !== undefined ? Number(matches) : 0,
        goals: goals !== undefined ? Number(goals) : 0,
        assists: assists !== undefined ? Number(assists) : 0,
        rating: rating !== undefined ? Number(rating) : 0,
        source: source || "manual",
      },
    });

    await logEvent({
      type: "PLAYER_STATS_UPSERTED",
      playerId,
      source: req.user?.role || "SYSTEM",
      payload: { stats },
    });

    return success(res, stats);
  } catch (err) {
    next(err);
  }
};