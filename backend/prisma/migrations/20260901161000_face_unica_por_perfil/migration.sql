-- Um perfil pode possuir somente uma biometria facial.
-- Em bancos criados por versões anteriores, preserva a facial mais antiga e
-- remove as amostras adicionais antes de aplicar a proteção definitiva.

DELETE FROM "FaceEmbedding"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "usuarioId"
        ORDER BY "criadoEm" ASC, "id" ASC
      ) AS ordem
    FROM "FaceEmbedding"
  ) AS duplicadas
  WHERE duplicadas.ordem > 1
);

CREATE UNIQUE INDEX "FaceEmbedding_usuarioId_key"
ON "FaceEmbedding"("usuarioId");
