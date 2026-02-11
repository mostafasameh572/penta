// src/middleware/validate.middleware.js
function getByPath(obj, pathArr) {
  return pathArr.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function validate(schema) {
  return (req, res, next) => {
    const input = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    const result = schema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((i) => {
        const path = i.path.join(".");
        const lastKey = i.path[i.path.length - 1];

        // raw value قبل ما zod يعمل coercion
        const raw = getByPath(input, i.path);

        const isMissing = raw === undefined || raw === null || raw === "";

        // ✅ Required field (missing)
        if (isMissing) {
          return { path, message: `${lastKey} is required` };
        }

        // ✅ Number but became NaN (e.g. "abc") -> nicer message
        if (
          i.code === "invalid_type" &&
          i.expected === "number" &&
          String(i.received).toLowerCase() === "nan"
        ) {
          return { path, message: `${lastKey} must be a number` };
        }

        // default
        return { path, message: i.message };
      });

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // replace with parsed (coerced) values
    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;

    next();
  };
}

module.exports = validate;
