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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" INTEGER,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("birthYear", "createdAt", "fullName", "fullNameNorm", "id", "name", "nameNorm", "photoUrl", "position", "shirtNumber", "teamId") SELECT "birthYear", "createdAt", "fullName", "fullNameNorm", "id", "name", "nameNorm", "photoUrl", "position", "shirtNumber", "teamId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_teamId_shirtNumber_key" ON "Player"("teamId", "shirtNumber");
CREATE UNIQUE INDEX "Player_teamId_fullNameNorm_birthYear_key" ON "Player"("teamId", "fullNameNorm", "birthYear");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
