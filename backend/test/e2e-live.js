import assert from "node:assert/strict";

const API = process.env.E2E_API_URL || "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL || "admin@steelcontrol.com";
const SENHA = process.env.E2E_PASSWORD || "Steel123!";
const LEASE_MS = Number(process.env.DEVICE_COMMAND_LEASE_MS || 15000);

async function json(url, options = {}) {
  const res = await fetch(url, options);
  const body = res.status === 204 ? null : await res.json().catch(() => ({}));
  return { res, body };
}

function auth(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function device(key) {
  return { "X-Device-Key": key, "Content-Type": "application/json" };
}

async function main() {
  console.log("[E2E] SteelControl — validação ponta a ponta");
  const health = await json(`${API}/api/health`);
  assert.equal(health.res.status, 200, "Backend/banco precisam estar ativos");

  const login = await json(`${API}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, senha: SENHA })
  });
  assert.equal(login.res.status, 200, `Login falhou: ${JSON.stringify(login.body)}`);
  const token = login.body.token;
  assert.ok(token, "Login não retornou token");

  const suffix = Date.now();
  let machineId = null;
  try {
    const criada = await json(`${API}/maquinas`, {
      method: "POST", headers: auth(token), body: JSON.stringify({
        nome: `E2E Braço ${suffix}`, setor: "QA", modelo: "E2E-01", codigo: `E2E-${suffix}`,
        fabricante: "SteelControl", tipo: "Braço robótico", descricao: "Máquina efêmera do teste E2E",
        modoSimulacao: false, controlador: "ESP32", protocolo: "HTTP_REST", intervaloLeitura: 2000,
        tempAtencao: 55, tempCritica: 70, energiaAtencao: 80, energiaCritica: 90,
        vibracaoAtencao: 4, vibracaoCritica: 7, ciclosManutencao: 10
      })
    });
    assert.equal(criada.res.status, 201, `Cadastro falhou: ${JSON.stringify(criada.body)}`);
    machineId = criada.body.maquina.id;
    const key = criada.body.deviceKey;
    assert.ok(key?.startsWith("scd_"), "Device Key não foi gerada");

    const normal = await json(`${API}/device/${machineId}/telemetria`, {
      method: "POST", headers: device(key), body: JSON.stringify({
        temperatura: 40, vibracao: 1.2, corrente: .8, consumoEnergia: 60,
        producao: 1, ciclos: 9, qualidadeSinal: 95, latenciaMs: 15, origem: "ESP32"
      })
    });
    assert.equal(normal.res.status, 200);
    assert.equal(normal.body.paradaSeguranca, false);

    const critica = await json(`${API}/device/${machineId}/telemetria`, {
      method: "POST", headers: device(key), body: JSON.stringify({
        temperatura: 75, vibracao: 1.3, corrente: 1, consumoEnergia: 65,
        producao: 1, ciclos: 10, qualidadeSinal: 92, latenciaMs: 18, origem: "ESP32"
      })
    });
    assert.equal(critica.res.status, 200);
    assert.equal(critica.body.paradaSeguranca, true, "Crítico deveria ativar parada lógica");

    const comando1 = await json(`${API}/device/${machineId}/comandos/proximo`, { headers: device(key) });
    assert.equal(comando1.res.status, 200);
    assert.equal(comando1.body.comando, "PARAR_SEGURANCA");
    const cmdStop = comando1.body.id;

    // Simula perda do ACK. Antes do lease não deve entregar novamente.
    const cedo = await json(`${API}/device/${machineId}/comandos/proximo`, { headers: device(key) });
    assert.equal(cedo.res.status, 204);
    console.log(`[E2E] aguardando lease de reentrega (${LEASE_MS} ms)...`);
    await new Promise(r => setTimeout(r, LEASE_MS + 800));
    const reenviado = await json(`${API}/device/${machineId}/comandos/proximo`, { headers: device(key) });
    assert.equal(reenviado.res.status, 200);
    assert.equal(reenviado.body.id, cmdStop, "Reentrega deve manter o mesmo ID");
    assert.ok(reenviado.body.tentativaEntrega >= 2, "Tentativas de entrega não incrementaram");

    const ack = await json(`${API}/device/${machineId}/comandos/${cmdStop}/confirmar`, {
      method: "POST", headers: device(key), body: JSON.stringify({ status: "CONCLUIDO" })
    });
    assert.equal(ack.res.status, 200);
    const ack2 = await json(`${API}/device/${machineId}/comandos/${cmdStop}/confirmar`, {
      method: "POST", headers: device(key), body: JSON.stringify({ status: "CONCLUIDO" })
    });
    assert.equal(ack2.res.status, 200);
    assert.equal(ack2.body.idempotente, true);

    // Normaliza sensores; máquina continua parada até liberação explícita.
    await json(`${API}/device/${machineId}/telemetria`, {
      method: "POST", headers: device(key), body: JSON.stringify({
        temperatura: 40, vibracao: 1, corrente: .4, consumoEnergia: 50,
        producao: 1, ciclos: 10, qualidadeSinal: 95, latenciaMs: 10, origem: "ESP32"
      })
    });
    const liberar = await json(`${API}/maquinas/${machineId}/liberar-seguranca`, {
      method: "POST", headers: auth(token)
    });
    assert.equal(liberar.res.status, 200, `Liberação falhou: ${JSON.stringify(liberar.body)}`);

    const cmdLiberar = await json(`${API}/device/${machineId}/comandos/proximo`, { headers: device(key) });
    assert.equal(cmdLiberar.res.status, 200);
    assert.equal(cmdLiberar.body.comando, "LIBERAR_OPERACAO");
    await json(`${API}/device/${machineId}/comandos/${cmdLiberar.body.id}/confirmar`, {
      method: "POST", headers: device(key), body: JSON.stringify({ status: "CONCLUIDO" })
    });

    // Manutenção redefine o baseline de ciclos.
    const manut = await json(`${API}/maquinas/${machineId}/manutencoes`, {
      method: "POST", headers: auth(token), body: JSON.stringify({
        tipo: "Preventiva", tecnico: "Teste E2E", descricao: "Reset do baseline de ciclos"
      })
    });
    assert.equal(manut.res.status, 201, `Manutenção falhou: ${JSON.stringify(manut.body)}`);

    const aposManut = await json(`${API}/device/${machineId}/telemetria`, {
      method: "POST", headers: device(key), body: JSON.stringify({
        temperatura: 40, vibracao: 1, corrente: .5, consumoEnergia: 55,
        producao: 2, ciclos: 11, qualidadeSinal: 90, latenciaMs: 12, origem: "ESP32"
      })
    });
    assert.equal(aposManut.res.status, 200);
    assert.notEqual(aposManut.body.status, "Manutenção", "Baseline de manutenção não foi reiniciado");

    const diag = await json(`${API}/maquinas/${machineId}/diagnostico`, { headers: auth(token) });
    assert.equal(diag.res.status, 200);
    assert.ok(["CONECTADA", "INSTAVEL"].includes(diag.body.estadoConexao.codigo));

    const auditoria = await json(`${API}/auditoria?limit=50`, { headers: auth(token) });
    assert.equal(auditoria.res.status, 200);
    assert.ok(Array.isArray(auditoria.body));

    console.log("[E2E] PASSOU: login → cadastro → Device Key → telemetria → parada → retry/ACK → liberação → manutenção → auditoria");
  } finally {
    if (machineId) {
      await json(`${API}/maquinas/${machineId}`, { method: "DELETE", headers: auth(token) }).catch(() => {});
    }
  }
}

main().catch(erro => {
  console.error("[E2E] FALHOU:", erro);
  process.exitCode = 1;
});
