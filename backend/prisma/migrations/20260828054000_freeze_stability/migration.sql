-- SteelControl Freeze Stability
-- Migração aditiva: baseline de manutenção e reentrega confiável de comandos.

ALTER TABLE "Maquina"
ADD COLUMN IF NOT EXISTS "ciclosUltimaManutencao" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Manutencao"
ADD COLUMN IF NOT EXISTS "ciclosNoRegistro" INTEGER;

ALTER TABLE "ComandoMaquina"
ADD COLUMN IF NOT EXISTS "tentativasEntrega" INTEGER NOT NULL DEFAULT 0;
