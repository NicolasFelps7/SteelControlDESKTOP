-- SteelControl — integração profissional de equipamentos específicos
ALTER TABLE "Maquina" ADD COLUMN "integracaoMeta" JSONB;
ALTER TABLE "TelemetryReading" ADD COLUMN "dadosExtras" JSONB;
