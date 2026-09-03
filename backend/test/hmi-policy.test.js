import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizarComandoIhm,
  cargoPodeComandoIhm,
  expiraEmComandoIhm,
  comandoPayloadExpirado,
  avaliarPermissaoStartIhm,
  controleRemotoIhmHabilitado
} from "../src/lib/hmiPolicy.js";

test("IHM só aceita comandos da allowlist", () => {
  assert.equal(normalizarComandoIhm("ihm_start"), "IHM_START");
  assert.equal(normalizarComandoIhm("DELETE_ALL"), null);
});

test("operador pode STOP/ACK mas não START", () => {
  assert.equal(cargoPodeComandoIhm("OPERADOR", "IHM_STOP"), true);
  assert.equal(cargoPodeComandoIhm("OPERADOR", "IHM_ACK"), true);
  assert.equal(cargoPodeComandoIhm("OPERADOR", "IHM_START"), false);
});

test("comando IHM recebe prazo curto e expira", () => {
  const expira = expiraEmComandoIhm("IHM_START", 1_000);
  assert.equal(new Date(expira).getTime(), 11_000);
  assert.equal(comandoPayloadExpirado({ expiresAt: expira }, 10_999), false);
  assert.equal(comandoPayloadExpirado({ expiresAt: expira }, 11_000), true);
});

test("START real exige conexão e confirmação positiva dos intertravamentos", () => {
  const maquina = {
    modoSimulacao: false,
    status: "Ligada",
    paradaSeguranca: false,
    temperatura: 30,
    tempAtencao: 55,
    consumoEnergia: 20,
    energiaAtencao: 80,
    vibracao: 1,
    vibracaoAtencao: 4
  };
  assert.equal(avaliarPermissaoStartIhm({ maquina, estadoConexao: { codigo: "OFFLINE" }, dadosExtras: {} }).permitido, false);
  assert.equal(avaliarPermissaoStartIhm({ maquina, estadoConexao: { codigo: "CONECTADA" }, dadosExtras: { hmi: { interlocks: { startPermitted: false } } } }).permitido, false);
  assert.equal(avaliarPermissaoStartIhm({ maquina, estadoConexao: { codigo: "CONECTADA" }, dadosExtras: { hmi: { interlocks: { startPermitted: true, estopOk: true, safetyDoorClosed: true } } } }).permitido, true);
});

test("controle remoto real é opt-in e simulação permanece utilizável", () => {
  assert.equal(controleRemotoIhmHabilitado({ modoSimulacao: true }), true);
  assert.equal(controleRemotoIhmHabilitado({ modoSimulacao: false, integracaoMeta: { hmi: { remoteControlEnabled: false } } }), false);
  assert.equal(controleRemotoIhmHabilitado({ modoSimulacao: false, integracaoMeta: { hmi: { remoteControlEnabled: true } } }), true);
});
