-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayerStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "playerId" INTEGER NOT NULL,
    CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlayerStats" ("assists", "goals", "id", "matches", "playerId", "rating") SELECT "assists", "goals", "id", "matches", "playerId", "rating" FROM "PlayerStats";
DROP TABLE "PlayerStats";
ALTER TABLE "new_PlayerStats" RENAME TO "PlayerStats";
CREATE UNIQUE INDEX "PlayerStats_playerId_key" ON "PlayerStats"("playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
