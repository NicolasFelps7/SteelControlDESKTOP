-- Persistência da identidade visual no PostgreSQL.
-- Evita perda de logos em serviços com filesystem efêmero.

ALTER TABLE "Empresa"
ADD COLUMN "logoData" BYTEA,
ADD COLUMN "logoMime" TEXT;
