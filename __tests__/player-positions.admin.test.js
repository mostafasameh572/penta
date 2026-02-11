require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

function makeToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");
  return jwt.sign(payload, secret);
}

describe("player-positions (ADMIN)", () => {
  const adminToken = makeToken({ id: 9999, role: "ADMIN" });

  let playerId;
  let positionId;
  let secondaryPositionId;

  beforeAll(async () => {
    // 1) هات لاعب موجود من الـ DB
    const playersRes = await request(app)
      .get("/players")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 201]).toContain(playersRes.status);

    const items =
      playersRes.body?.data?.items ??
      playersRes.body?.data ??
      [];

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    playerId = items[0].id;
    expect(playerId).toBeTruthy();

    // 2) هات بوزيشنات موجودة من الـ DB
    const posRes = await request(app)
      .get("/positions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 201]).toContain(posRes.status);

    const positions = posRes.body?.data ?? [];
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBeGreaterThanOrEqual(2);

    positionId = positions[0].id;
    secondaryPositionId = positions[1].id;

    expect(positionId).toBeTruthy();
    expect(secondaryPositionId).toBeTruthy();
  });

  it("GET /player-positions should return 200 for admin", async () => {
    const res = await request(app)
      .get("/player-positions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /player-positions should 409 if already assigned", async () => {
    // ensure relation exists (201 or 409)
    const ensure = await request(app)
      .post("/player-positions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ playerId, positionId, isPrimary: true });

    expect([201, 409]).toContain(ensure.status);

    // try same relation again => must be 409
    const res = await request(app)
      .post("/player-positions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ playerId, positionId, isPrimary: false });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("DELETE primary should 409 when another position exists", async () => {
    // 1) ensure SECONDARY assignment exists
    const a1 = await request(app)
      .post("/player-positions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ playerId, positionId: secondaryPositionId, isPrimary: false });

    expect([201, 409]).toContain(a1.status);

    // 2) ensure PRIMARY is set to positionId
    const p = await request(app)
      .put("/player-positions/primary")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ playerId, positionId });

    expect([200, 404]).toContain(p.status);

    // 3) now try deleting the PRIMARY relation => should be 409 (business rule)
    const del = await request(app)
      .delete("/player-positions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ playerId, positionId });

    expect(del.status).toBe(409);
    expect(del.body.success).toBe(false);
  });
});
