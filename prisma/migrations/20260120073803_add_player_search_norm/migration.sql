-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nameNorm" TEXT NOT NULL DEFAULT '',
    "fullNameNorm" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL,
    "shirtNumber" INTEGER NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" INTEGER,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("birthYear", "createdAt", "fullName", "id", "name", "photoUrl", "position", "shirtNumber", "teamId") SELECT "birthYear", "createdAt", "fullName", "id", "name", "photoUrl", "position", "shirtNumber", "teamId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE INDEX "Player_nameNorm_idx" ON "Player"("nameNorm");
CREATE INDEX "Player_fullNameNorm_idx" ON "Player"("fullNameNorm");
CREATE UNIQUE INDEX "Player_teamId_shirtNumber_key" ON "Player"("teamId", "shirtNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
