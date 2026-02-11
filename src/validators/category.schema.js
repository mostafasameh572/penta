// src/validators/category.schema.js
const { z } = require("zod");

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "name is required").max(50),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "name is required").max(50),
  }),
  params: idParam,
  query: z.object({}).passthrough(),
});

const deleteCategorySchema = z.object({
  body: z.object({}).passthrough(),
  params: idParam,
  query: z.object({}).passthrough(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
};
