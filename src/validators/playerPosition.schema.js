// src/validators/playerPosition.schema.js
const { z } = require("zod");

const emptyObj = z.object({}).passthrough();

const playerIdSchema = z.coerce
  .number({
    required_error: "playerId is required",
    invalid_type_error: "playerId must be a number",
  })
  .int("playerId must be an integer")
  .positive("playerId must be a positive number");

const positionIdSchema = z.coerce
  .number({
    required_error: "positionId is required",
    invalid_type_error: "positionId must be a number",
  })
  .int("positionId must be an integer")
  .positive("positionId must be a positive number");

const createSchema = z.object({
  body: z.object({
    playerId: playerIdSchema,
    positionId: positionIdSchema,
    // optional: accept true/false or "true"/"false"
    isPrimary: z.coerce.boolean().optional(),
  }),
  params: emptyObj,
  query: emptyObj,
});

const setPrimarySchema = z.object({
  body: z.object({
    playerId: playerIdSchema,
    positionId: positionIdSchema,
  }),
  params: emptyObj,
  query: emptyObj,
});

const unassignSchema = z.object({
  body: z.object({
    playerId: playerIdSchema,
    positionId: positionIdSchema,
  }),
  params: emptyObj,
  query: emptyObj,
});

const listSchema = z.object({
  body: emptyObj,
  params: emptyObj,
  query: emptyObj,
});

module.exports = {
  createSchema,
  setPrimarySchema,
  unassignSchema,
  listSchema,
};
