-- Revogação server-side de sessões JWT.
ALTER TABLE "Usuario"
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
