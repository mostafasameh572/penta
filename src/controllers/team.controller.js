// D:\penta\src\controllers\team.controller.js

const { success, error } = require("../utils/response");
const teamService = require("../services/team.service");

exports.createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;
    const team = await teamService.createTeam(name);
    return success(res, team, 201);
  } catch (err) {
    next(err);
  }
};

exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await teamService.getAllTeams();
    return success(res, teams);
  } catch (err) {
    next(err);
  }
};

exports.assignCoachToTeam = async (req, res, next) => {
  try {
    const { userId, teamId } = req.body;

    if (!userId) return error(res, "userId is required", 400);

    // teamId ممكن يكون null لفك الربط
    const updated = await teamService.assignCoachToTeam(userId, teamId ?? null);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};
