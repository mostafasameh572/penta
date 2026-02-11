// src/docs/swagger.js
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Penta API",
      version: "1.0.0",
      description: "Football Player Management API",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // ✅ Windows-safe absolute paths
  apis: [
    path.join(__dirname, "../index.js"),
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
