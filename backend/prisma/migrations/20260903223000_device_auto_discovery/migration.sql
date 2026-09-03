-- SteelControl: identidade estável para provisionamento automático de dispositivos
ALTER TABLE "Maquina" ADD COLUMN "discoveryId" TEXT;
CREATE UNIQUE INDEX "Maquina_discoveryId_key" ON "Maquina"("discoveryId");
