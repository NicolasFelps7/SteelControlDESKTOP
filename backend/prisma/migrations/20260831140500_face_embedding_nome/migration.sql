-- Adiciona um nome amigável a cada amostra facial para permitir
-- gerenciamento e exclusão individual no painel da empresa.
ALTER TABLE "FaceEmbedding"
ADD COLUMN "nome" TEXT;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "usuarioId"
      ORDER BY "criadoEm" ASC, "id" ASC
    ) AS rn
  FROM "FaceEmbedding"
)
UPDATE "FaceEmbedding" AS f
SET "nome" = 'Facial ' || ranked.rn
FROM ranked
WHERE f."id" = ranked."id"
  AND f."nome" IS NULL;

ALTER TABLE "FaceEmbedding"
ALTER COLUMN "nome" SET NOT NULL;

CREATE INDEX "FaceEmbedding_usuarioId_nome_idx"
ON "FaceEmbedding"("usuarioId", "nome");
