// src/controllers/team.controller.js

const { success, error } = require("../utils/response");
const teamService = require("../services/team.service");

// helper
function getClubIdOrNull(req) {
  const clubId = req.user?.clubId;
  if (clubId === undefined || clubId === null || clubId === "") return null;
  const n = Number(clubId);
  return Number.isFinite(n) ? n : null;
}

exports.createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, "name is required", 400);

    const clubId = getClubIdOrNull(req);

    const team = await teamService.createTeam({
      name,
      clubId,
    });

    return success(res, team, 201);
  } catch (err) {
    next(err);
  }
};

exports.getAllTeams = async (req, res, next) => {
  try {
    const clubId = getClubIdOrNull(req);

    const teams = await teamService.getAllTeams({
      clubId,
    });

    return success(res, teams);
  } catch (err) {
    next(err);
  }
};

exports.assignCoachToTeam = async (req, res, next) => {
  try {
    const { userId, teamId } = req.body;

    if (!userId) return error(res, "userId is required", 400);

    const clubId = getClubIdOrNull(req);

    const updated = await teamService.assignCoachToTeam({
      userId,
      teamId: teamId ?? null,
      clubId,
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};