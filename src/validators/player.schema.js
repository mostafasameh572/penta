// src/validators/player.schema.js
const { z } = require("zod");

const emptyObj = z.object({}).passthrough();

const idSchema = z.coerce.number().int().positive("must be a positive number");

// helper: nullable int (teamId/categoryId ممكن يبقوا null)
const nullableIdSchema = z.union([idSchema, z.literal(null)]);

// strings
const strReq = (field) =>
  z
    .string({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a string`,
    })
    .trim()
    .min(1, `${field} is required`);

const strOpt = (field) =>
  z
    .string({
      invalid_type_error: `${field} must be a string`,
    })
    .trim()
    .optional();

// numbers — coerce عشان "9" تبقى 9
const intReq = (field) =>
  z.coerce
    .number({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a number`,
    })
    .int(`${field} must be an integer`)
    .positive(`${field} must be a positive number`);

const intOpt = (field) =>
  z.coerce
    .number({
      invalid_type_error: `${field} must be a number`,
    })
    .int(`${field} must be an integer`)
    .positive(`${field} must be a positive number`)
    .optional();

const boolOpt = (field) =>
  z.coerce
    .boolean({
      invalid_type_error: `${field} must be a boolean`,
    })
    .optional();

/**
 * GET /players (query)
 */
const listSchema = z.object({
  body: emptyObj,
  params: emptyObj,
  query: z
    .object({
      search: z.string().optional(),
      teamId: z.string().optional(), // controller بيحوّله number
      includeInactive: z.string().optional(), // "true"/"false"
      page: z.string().optional(),
      take: z.string().optional(),
    })
    .passthrough(),
});

/**
 * GET /players/:id
 */
const getByIdSchema = z.object({
  body: emptyObj,
  params: z.object({
    id: idSchema,
  }),
  query: emptyObj,
});

/**
 * POST /players (Admin)
 */
const createSchema = z.object({
  body: z.object({
    name: strReq("name"),
    fullName: strReq("fullName"),
    position: strReq("position"),
    shirtNumber: intReq("shirtNumber"),
    birthYear: intReq("birthYear"),
    teamId: nullableIdSchema.optional(),
    categoryId: nullableIdSchema.optional(),
    photoUrl: z
      .string({ invalid_type_error: "photoUrl must be a string" })
      .trim()
      .nullable()
      .optional(),
  }),
  params: emptyObj,
  query: emptyObj,
});

/**
 * PUT /players/:id (Admin)
 * كله optional (لكن لازم field واحد على الأقل يبقى موجود فعلًا)
 */
const updateBody = z
  .object({
    name: strOpt("name"),
    fullName: strOpt("fullName"),
    position: strOpt("position"),
    shirtNumber: intOpt("shirtNumber"),
    birthYear: intOpt("birthYear"),
    teamId: nullableIdSchema.optional(),
    categoryId: nullableIdSchema.optional(),
    photoUrl: z
      .string({ invalid_type_error: "photoUrl must be a string" })
      .trim()
      .nullable()
      .optional(),
    isActive: boolOpt("isActive"),
  })
  .superRefine((obj, ctx) => {
    const hasAtLeastOne = Object.values(obj).some((v) => v !== undefined);
    if (!hasAtLeastOne) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
        path: [], // يخليها message عامة في body
      });
    }
  });

const updateSchema = z.object({
  body: updateBody,
  params: z.object({
    id: idSchema,
  }),
  query: emptyObj,
});

/**
 * DELETE /players/:id (soft delete)
 */
const deleteSchema = z.object({
  body: emptyObj,
  params: z.object({
    id: idSchema,
  }),
  query: emptyObj,
});

/**
 * PUT /players/:id/activate | deactivate
 */
const activateSchema = z.object({
  body: emptyObj,
  params: z.object({
    id: idSchema,
  }),
  query: emptyObj,
});

/**
 * PUT /players/:id/stats
 */
const statsSchema = z.object({
  body: z.object({
    matches: z.coerce.number().int().min(0, "matches must be >= 0").optional(),
    goals: z.coerce.number().int().min(0, "goals must be >= 0").optional(),
    assists: z.coerce.number().int().min(0, "assists must be >= 0").optional(),
    rating: z.coerce.number().min(0, "rating must be >= 0").optional(),
    source: z.string().optional(),
  }),
  params: z.object({
    id: idSchema,
  }),
  query: emptyObj,
});

module.exports = {
  listSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  deleteSchema,
  activateSchema,
  statsSchema,
};
