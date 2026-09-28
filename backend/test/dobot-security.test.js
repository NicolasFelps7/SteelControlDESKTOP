import test from "node:test";
import assert from "node:assert/strict";

import {
  controleRemotoDobotHabilitado,
  expiraEmComandoDobot,
  validarPayloadDobot
} from "../src/lib/dobotPolicy.js";

test("Dobot real exige remoteControlEnabled explícito", () => {
  assert.equal(controleRemotoDobotHabilitado({
    modoSimulacao: false,
    integracaoMeta: { dobot: { remoteControlEnabled: true } }
  }), true);
  assert.equal(controleRemotoDobotHabilitado({
    modoSimulacao: false,
    integracaoMeta: { dobot: { allowMotion: true } }
  }), false);
});

test("PTP aceita somente envelope e velocidade seguros", () => {
  assert.deepEqual(
    validarPayloadDobot("DOBOT_PTP", { x: 150, y: 0, z: 100, r: 45, velocidade: 30 }),
    { x: 150, y: 0, z: 100, r: 45, velocidade: 30 }
  );
  assert.throws(
    () => validarPayloadDobot("DOBOT_PTP", { x: 500, y: 0, z: 100, r: 0, velocidade: 30 }),
    /envelope seguro/
  );
  assert.throws(
    () => validarPayloadDobot("DOBOT_PTP", { x: 150, y: 0, z: 100, r: 0, velocidade: 100 }),
    /Velocidade fora/
  );
});

test("comandos Dobot recebem TTL curto", () => {
  const start = Date.parse("2026-09-21T00:00:00.000Z");
  assert.equal(expiraEmComandoDobot("DOBOT_PTP", start), "2026-09-21T00:00:05.000Z");
  assert.equal(expiraEmComandoDobot("DOBOT_STOP", start), "2026-09-21T00:00:15.000Z");
});
