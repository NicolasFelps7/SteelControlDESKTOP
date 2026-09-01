-- Hardening SteelControl: rastreabilidade, telemetria e exclusão lógica

ALTER TABLE "Maquina"
ADD COLUMN "modoSimulacao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "excluidaEm" TIMESTAMP(3),
ADD COLUMN "excluidaPorId" INTEGER;

CREATE INDEX "Maquina_ativo_idx" ON "Maquina"("ativo");

ALTER TABLE "Manutencao"
ADD COLUMN "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "excluidaEm" TIMESTAMP(3),
ADD COLUMN "excluidaPorId" INTEGER;

CREATE INDEX "Manutencao_ativa_idx" ON "Manutencao"("ativa");

CREATE TABLE "TelemetryReading" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "producao" INTEGER NOT NULL,
    "ciclos" INTEGER NOT NULL,
    "consumoEnergia" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'SIMULADOR',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelemetryReading_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TelemetryReading_maquinaId_criadoEm_idx"
ON "TelemetryReading"("maquinaId", "criadoEm");

CREATE INDEX "TelemetryReading_criadoEm_idx"
ON "TelemetryReading"("criadoEm");

ALTER TABLE "TelemetryReading"
ADD CONSTRAINT "TelemetryReading_maquinaId_fkey"
FOREIGN KEY ("maquinaId")
REFERENCES "Maquina"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" INTEGER,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_empresaId_criadoEm_idx"
ON "AuditLog"("empresaId", "criadoEm");

CREATE INDEX "AuditLog_usuarioId_idx"
ON "AuditLog"("usuarioId");

CREATE INDEX "AuditLog_entidade_entidadeId_idx"
ON "AuditLog"("entidade", "entidadeId");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_empresaId_fkey"
FOREIGN KEY ("empresaId")
REFERENCES "Empresa"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "Usuario"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
