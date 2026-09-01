import test from "node:test";
import assert from "node:assert/strict";

import {
  validarMesmaPessoaLiveness,
  similaridadeCosseno,
  encontrarCorrespondenciaFacial
} from "../src/lib/faceSecurity.js";

import {
  podeAcionarSimulacao,
  calcularEstadoConexao
} from "../src/lib/machinePolicy.js";

import {
  podeRegistrarManutencao,
  podeExcluirManutencao
} from "../src/lib/maintenancePolicy.js";


test("liveness aceita embeddings equivalentes", () => {
  const resultado =
    validarMesmaPessoaLiveness({
      embeddingMovimento: [1, 0, 0, 0],
      embeddingFinal: [0.99, 0.01, 0, 0],
      threshold: 0.90
    });

  assert.equal(resultado.valida, true);
  assert.ok(resultado.similaridade > 0.99);
});


test("liveness rejeita identidades incompatíveis", () => {
  const resultado =
    validarMesmaPessoaLiveness({
      embeddingMovimento: [1, 0, 0],
      embeddingFinal: [0, 1, 0],
      threshold: 0.50
    });

  assert.equal(resultado.valida, false);
});


test("similaridade com tamanhos diferentes retorna -1", () => {
  assert.equal(
    similaridadeCosseno([1, 2], [1, 2, 3]),
    -1
  );
});




test("cadastro facial identifica rosto já vinculado a outro perfil", () => {
  const encontrado =
    encontrarCorrespondenciaFacial({
      embedding: [1, 0, 0, 0],
      faces: [
        {
          id: 10,
          usuarioId: 22,
          embedding: [0.99, 0.01, 0, 0]
        },
        {
          id: 11,
          usuarioId: 23,
          embedding: [0, 1, 0, 0]
        }
      ],
      threshold: 0.58
    });

  assert.equal(encontrado?.usuarioId, 22);
  assert.ok(encontrado.similaridade > 0.99);
});


test("cadastro facial aceita identidade sem correspondência", () => {
  const encontrado =
    encontrarCorrespondenciaFacial({
      embedding: [1, 0, 0],
      faces: [
        {
          id: 1,
          usuarioId: 2,
          embedding: [0, 1, 0]
        }
      ],
      threshold: 0.58
    });

  assert.equal(encontrado, null);
});

test("administrador pode acionar simulador", () => {
  assert.equal(
    podeAcionarSimulacao("ADMINISTRADOR"),
    true
  );
});


test("supervisor pode acionar simulador", () => {
  assert.equal(
    podeAcionarSimulacao("SUPERVISOR"),
    true
  );
});


test("operador não pode acionar simulador", () => {
  assert.equal(
    podeAcionarSimulacao("OPERADOR"),
    false
  );
});


test("técnico não pode acionar simulador", () => {
  assert.equal(
    podeAcionarSimulacao("TECNICO"),
    false
  );
});


test("visitante não pode acionar simulador", () => {
  assert.equal(
    podeAcionarSimulacao("VISITANTE"),
    false
  );
});


test("administrador pode registrar manutenção", () => {
  assert.equal(
    podeRegistrarManutencao("ADMINISTRADOR"),
    true
  );
});

test("supervisor pode registrar manutenção", () => {
  assert.equal(
    podeRegistrarManutencao("SUPERVISOR"),
    true
  );
});

test("técnico pode registrar manutenção", () => {
  assert.equal(
    podeRegistrarManutencao("TECNICO"),
    true
  );
});

test("operador não pode registrar manutenção", () => {
  assert.equal(
    podeRegistrarManutencao("OPERADOR"),
    false
  );
});

test("visitante não pode registrar manutenção", () => {
  assert.equal(
    podeRegistrarManutencao("VISITANTE"),
    false
  );
});

test("somente administrador pode excluir manutenção", () => {
  assert.equal(
    podeExcluirManutencao("ADMINISTRADOR"),
    true
  );

  assert.equal(
    podeExcluirManutencao("SUPERVISOR"),
    false
  );
});


test("estado de conexão identifica simulação", () => {
  const estado =
    calcularEstadoConexao({
      modoSimulacao: true,
      telemetria: []
    });

  assert.equal(
    estado.codigo,
    "SIMULACAO"
  );
});


test("máquina real sem telemetria fica offline", () => {
  const estado =
    calcularEstadoConexao({
      modoSimulacao: false,
      statusConexao: "Configurada",
      intervaloLeitura: 2000,
      telemetria: []
    });

  assert.equal(
    estado.codigo,
    "OFFLINE"
  );
});


test("telemetria real recente marca máquina conectada", () => {
  const agora =
    Date.now();

  const estado =
    calcularEstadoConexao(
      {
        modoSimulacao: false,
        intervaloLeitura: 2000,
        telemetria: [
          {
            origem: "ESP32",
            criadoEm:
              new Date(
                agora - 1000
              )
          }
        ]
      },
      agora
    );

  assert.equal(
    estado.codigo,
    "CONECTADA"
  );

  assert.equal(
    estado.conectado,
    true
  );
});


test("telemetria simulada nunca conecta máquina real", () => {
  const agora =
    Date.now();

  const estado =
    calcularEstadoConexao(
      {
        modoSimulacao: false,
        intervaloLeitura: 2000,
        telemetria: [
          {
            origem: "SIMULADOR",
            criadoEm:
              new Date(
                agora - 1000
              )
          }
        ]
      },
      agora
    );

  assert.equal(
    estado.codigo,
    "OFFLINE"
  );
});


test("telemetria real antiga marca máquina offline", () => {
  const agora =
    Date.now();

  const estado =
    calcularEstadoConexao(
      {
        modoSimulacao: false,
        intervaloLeitura: 2000,
        telemetria: [
          {
            origem: "ESP32",
            criadoEm:
              new Date(
                agora - 30_000
              )
          }
        ]
      },
      agora
    );

  assert.equal(
    estado.codigo,
    "OFFLINE"
  );
});


test("conexão recente mas atrasada fica instável", () => {
  const agora = Date.now();
  const estado = calcularEstadoConexao(
    {
      modoSimulacao: false,
      intervaloLeitura: 2000,
      ultimaTelemetriaEm: new Date(agora - 7000),
      telemetria: []
    },
    agora
  );

  assert.equal(estado.codigo, "INSTAVEL");
});


test("heartbeat recente mantém conexão real ativa", () => {
  const agora = Date.now();
  const estado = calcularEstadoConexao(
    {
      modoSimulacao: false,
      intervaloLeitura: 2000,
      ultimoHeartbeatEm: new Date(agora - 1000),
      telemetria: []
    },
    agora
  );

  assert.equal(estado.codigo, "CONECTADA");
});

import {
  calcularCiclosDesdeManutencao,
  dataLimiteReentrega,
  comandoJaFinalizado
} from "../src/lib/industrialPolicy.js";

test("manutenção por ciclos usa baseline da última manutenção", () => {
  assert.equal(calcularCiclosDesdeManutencao(1001, 1000), 1);
  assert.equal(calcularCiclosDesdeManutencao(1500, 1000), 500);
});

test("lease de comando calcula janela de reentrega", () => {
  const agora = 100_000;
  assert.equal(dataLimiteReentrega(agora, 15_000).getTime(), 85_000);
});

test("status finais de comando são reconhecidos", () => {
  assert.equal(comandoJaFinalizado("CONCLUIDO"), true);
  assert.equal(comandoJaFinalizado("FALHOU"), true);
  assert.equal(comandoJaFinalizado("CANCELADO"), true);
  assert.equal(comandoJaFinalizado("ENTREGUE"), false);
});
