require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

function makeToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");

  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn || "1h",
  });
}

describe("player-positions (COACH)", () => {
  let coachToken;

  beforeAll(() => {
    coachToken = makeToken({
      id: 8888,
      role: "COACH",
      teamId: 1, // لازم coach يبقى ليه teamId وإلا auth middleware هيرجع 403
    });

    expect(coachToken).toBeTruthy();
  });

  it("GET /player-positions should return 200 for coach", async () => {
    const res = await request(app)
      .get("/player-positions")
      .set("Authorization", `Bearer ${coachToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /player-positions should be forbidden for coach", async () => {
    const res = await request(app)
      .post("/player-positions")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ playerId: 8, positionId: 5, isPrimary: false });

    expect(res.status).toBe(403);
  });

  it("PUT /player-positions/primary should be forbidden for coach", async () => {
    const res = await request(app)
      .put("/player-positions/primary")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ playerId: 8, positionId: 5 });

    expect(res.status).toBe(403);
  });

  it("DELETE /player-positions should be forbidden for coach", async () => {
    const res = await request(app)
      .delete("/player-positions")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ playerId: 8, positionId: 5 });

    expect(res.status).toBe(403);
  });
});
