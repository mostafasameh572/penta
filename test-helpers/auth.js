const request = require("supertest");
const app = require("../../src/app");

function extractToken(body) {
  return (
    body?.token ||
    body?.data?.token ||
    body?.accessToken ||
    body?.data?.accessToken
  );
}

async function loginAndGetToken(email, password) {
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password });

  if (![200, 201].includes(res.status)) {
    throw new Error(
      `Login failed for ${email} | status=${res.status} | body=${JSON.stringify(
        res.body
      )}`
    );
  }

  const token = extractToken(res.body);
  if (!token) {
    throw new Error(`Token not found in login response for ${email}`);
  }

  return token;
}

module.exports = {
  loginAndGetToken,
};
