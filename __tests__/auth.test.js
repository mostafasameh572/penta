require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");

function extractToken(body) {
  // أشكال شائعة:
  // { success:true, data:{ token } }
  // { token }
  // { accessToken }
  // { data:{ accessToken } }
  return (
    body?.token ||
    body?.accessToken ||
    body?.data?.token ||
    body?.data?.accessToken ||
    body?.data?.data?.token ||
    body?.data?.data?.accessToken ||
    null
  );
}

describe("auth /login", () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const coachEmail = process.env.COACH_EMAIL;
  const coachPassword = process.env.COACH_PASSWORD;

  beforeAll(() => {
    expect(process.env.JWT_SECRET).toBeTruthy();
    expect(adminEmail).toBeTruthy();
    expect(adminPassword).toBeTruthy();
    expect(coachEmail).toBeTruthy();
    expect(coachPassword).toBeTruthy();
  });

  it("POST /auth/login should 200 for ADMIN and return token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: adminEmail, password: adminPassword });

    expect([200, 201]).toContain(res.status);

    const token = extractToken(res.body);
    expect(token).toBeTruthy();
  });

  it("POST /auth/login should 200 for COACH and return token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: coachEmail, password: coachPassword });

    expect([200, 201]).toContain(res.status);

    const token = extractToken(res.body);
    expect(token).toBeTruthy();
  });

  it("POST /auth/login should 401/400 for invalid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: adminEmail, password: "WRONG_PASSWORD_123" });

    // حسب تنفيذك ممكن 400 أو 401
    expect([400, 401]).toContain(res.status);
  });
});
