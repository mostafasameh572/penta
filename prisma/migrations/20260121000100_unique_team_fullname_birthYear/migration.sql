-- Add unique constraint for Player(teamId, fullNameNorm, birthYear) 
-- SQLite: create unique index 
CREATE UNIQUE INDEX IF NOT EXISTS "Player_teamId_fullNameNorm_birthYear_key" 
ON "Player"("teamId","fullNameNorm","birthYear"); 
