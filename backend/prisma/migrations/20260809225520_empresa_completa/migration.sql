-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "logoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Alerta_maquinaId_idx" ON "Alerta"("maquinaId");

-- CreateIndex
CREATE INDEX "Alerta_criadoEm_idx" ON "Alerta"("criadoEm");

-- CreateIndex
CREATE INDEX "FaceEmbedding_usuarioId_idx" ON "FaceEmbedding"("usuarioId");

-- CreateIndex
CREATE INDEX "FaceEmbedding_criadoEm_idx" ON "FaceEmbedding"("criadoEm");

-- CreateIndex
CREATE INDEX "Log_maquinaId_idx" ON "Log"("maquinaId");

-- CreateIndex
CREATE INDEX "Log_criadoEm_idx" ON "Log"("criadoEm");

-- CreateIndex
CREATE INDEX "Manutencao_maquinaId_idx" ON "Manutencao"("maquinaId");

-- CreateIndex
CREATE INDEX "Manutencao_criadaEm_idx" ON "Manutencao"("criadaEm");

-- CreateIndex
CREATE INDEX "Maquina_empresaId_idx" ON "Maquina"("empresaId");

-- CreateIndex
CREATE INDEX "Maquina_status_idx" ON "Maquina"("status");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_cargo_idx" ON "Usuario"("cargo");

-- CreateIndex
CREATE INDEX "Usuario_ativo_idx" ON "Usuario"("ativo");
