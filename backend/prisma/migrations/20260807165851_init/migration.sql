-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'TECNICO', 'OPERADOR', 'VISITANTE');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "cargo" "Cargo" NOT NULL DEFAULT 'VISITANTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquina" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "fabricante" TEXT,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ligada',
    "temperatura" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "producao" INTEGER NOT NULL DEFAULT 0,
    "ciclos" INTEGER NOT NULL DEFAULT 0,
    "consumoEnergia" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "manutencao" TEXT NOT NULL DEFAULT 'Normal',
    "ultimaManutencao" TEXT NOT NULL DEFAULT 'Sem registro',
    "proximaManutencao" TEXT NOT NULL DEFAULT 'A definir',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceEmbedding" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "embedding" JSONB NOT NULL,
    "modelo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaceEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Maquina_empresaId_codigo_key" ON "Maquina"("empresaId", "codigo");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maquina" ADD CONSTRAINT "Maquina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEmbedding" ADD CONSTRAINT "FaceEmbedding_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
