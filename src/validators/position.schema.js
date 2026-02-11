// src/validators/position.schema.js
const { z } = require("zod");

// helper: empty objects
const emptyObj = z.object({}).passthrough();

// ✅ shared: name validator with consistent messages
// - missing (undefined/null) => "" => "name is required"
// - wrong type => "name must be a string"
const nameSchema = z.preprocess(
  (v) => (v === undefined || v === null ? "" : v),
  z
    .string({
      invalid_type_error: "name must be a string",
    })
    .trim()
    .min(1, "name is required")
);

const createSchema = z.object({
  body: z.object({
    name: nameSchema,
  }),
  params: emptyObj,
  query: emptyObj,
});

const updateSchema = z.object({
  body: z.object({
    name: nameSchema,
  }),
  params: z.object({
    id: z.coerce.number().int().positive("id must be a positive number"),
  }),
  query: emptyObj,
});

const deleteSchema = z.object({
  body: emptyObj,
  params: z.object({
    id: z.coerce.number().int().positive("id must be a positive number"),
  }),
  query: emptyObj,
});

const bestPlayerSchema = z.object({
  body: emptyObj,
  params: z.object({
    id: z.coerce.number().int().positive("id must be a positive number"),
  }),
  query: emptyObj,
});

const listSchema = z.object({
  body: emptyObj,
  params: emptyObj,
  query: emptyObj,
});

module.exports = {
  createSchema,
  updateSchema,
  deleteSchema,
  bestPlayerSchema,
  listSchema,
};
