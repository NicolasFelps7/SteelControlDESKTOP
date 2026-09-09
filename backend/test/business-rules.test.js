import test from "node:test";
import assert from "node:assert/strict";

import {
  validarMesmaPessoaLiveness,
  similaridadeCosseno,
  encontrarCorrespondenciaFacial,
  classificarCorrespondenciaFacial,
  criarPacoteTemplatesFaciais,
  extrairTemplatesFaciais
} from "../src/lib/faceSecurity.js";

import {
  podeAcionarSimulacao,
  calcularEstadoConexao
} from "../src/lib/machinePolicy.js";

import {
  podeRegistrarManutencao,
  podeExcluirManutencao
} from "../src/lib/maintenancePolicy.js";

import {
  criarAmostraFacialExclusiva,
  FACE_DUPLICATE_THRESHOLD
} from "../src/lib/faceIdentity.js";


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


test("login facial sinaliza dois usuários muito próximos como ambíguos", () => {
  const resultado =
    classificarCorrespondenciaFacial({
      embedding: [1, 0, 0],
      faces: [
        {
          id: 1,
          usuarioId: 10,
          embedding: [1, 0, 0]
        },
        {
          id: 2,
          usuarioId: 20,
          embedding: [0.998, 0.063, 0]
        }
      ],
      threshold: 0.58,
      margemMinima: 0.08
    });

  assert.equal(resultado.status, "ambiguo");
  assert.equal(resultado.melhor.usuarioId, 10);
  assert.equal(resultado.segundo.usuarioId, 20);
  assert.ok(resultado.margem < 0.08);
});


test("amostras próximas do mesmo usuário não geram ambiguidade", () => {
  const resultado =
    classificarCorrespondenciaFacial({
      embedding: [1, 0, 0],
      faces: [
        {
          id: 1,
          usuarioId: 10,
          embedding: [1, 0, 0]
        },
        {
          id: 2,
          usuarioId: 10,
          embedding: [0.999, 0.04, 0]
        }
      ]
    });

  assert.equal(resultado.status, "reconhecido");
  assert.equal(resultado.segundo, null);
});


test("login facial reconhece quando existe margem segura", () => {
  const resultado =
    classificarCorrespondenciaFacial({
      embedding: [1, 0, 0],
      faces: [
        {
          id: 1,
          usuarioId: 10,
          embedding: [1, 0, 0]
        },
        {
          id: 2,
          usuarioId: 20,
          embedding: [0.6, 0.8, 0]
        }
      ],
      threshold: 0.58,
      margemMinima: 0.08
    });

  assert.equal(resultado.status, "reconhecido");
  assert.equal(resultado.melhor.usuarioId, 10);
  assert.ok(resultado.margem > 0.08);
});


test("login facial rejeita melhor candidato abaixo do limite", () => {
  const resultado =
    classificarCorrespondenciaFacial({
      embedding: [1, 0, 0],
      faces: [
        {
          id: 1,
          usuarioId: 10,
          embedding: [0, 1, 0]
        }
      ],
      threshold: 0.58
    });

  assert.equal(resultado.status, "nao_encontrado");
});


test("cadastro facial converte retorno void do advisory lock para texto", async () => {
  let consultaLock = "";

  const tx = {
    async $queryRawUnsafe(consulta) {
      consultaLock = consulta;
      return [{ lock: "" }];
    },
    faceEmbedding: {
      async count() {
        return 0;
      },
      async findFirst() {
        return null;
      },
      async findMany() {
        return [];
      },
      async create({ data }) {
        return {
          id: 1,
          ...data
        };
      }
    }
  };

  const prismaFake = {
    async $transaction(callback) {
      return callback(tx);
    }
  };

  const resultado =
    await criarAmostraFacialExclusiva({
      prisma: prismaFake,
      usuarioId: 10,
      embedding: [1, 0, 0],
      maxSamples: 5,
      nome: "Principal"
    });

  assert.equal(resultado.ok, true);
  assert.match(consultaLock, /::text/);
  assert.match(consultaLock, /AS "lock"/);
});

test("cadastro facial rejeita segunda biometria no mesmo perfil", async () => {
  let tentouCriar = false;

  const tx = {
    async $queryRawUnsafe() {
      return [{ lock: "" }];
    },
    faceEmbedding: {
      async count() {
        return 1;
      },
      async create() {
        tentouCriar = true;
        return null;
      }
    }
  };

  const prismaFake = {
    async $transaction(callback) {
      return callback(tx);
    }
  };

  const resultado =
    await criarAmostraFacialExclusiva({
      prisma: prismaFake,
      usuarioId: 10,
      embedding: [1, 0, 0],
      nome: "Outra facial"
    });

  assert.equal(resultado.ok, false);
  assert.equal(
    resultado.motivo,
    "perfil_ja_possui_face"
  );
  assert.equal(tentouCriar, false);
});

test("cadastro facial usa limiar conservador para impedir duplicidade", () => {
  assert.equal(FACE_DUPLICATE_THRESHOLD, 0.50);
});


test("cadastro facial bloqueia duplicidade detectada na captura de liveness", async () => {
  let tentouCriar = false;

  const tx = {
    async $queryRawUnsafe() {
      return [{ lock: "" }];
    },
    faceEmbedding: {
      async count() {
        return 0;
      },
      async findFirst() {
        return null;
      },
      async findMany() {
        return [
          {
            id: 77,
            usuarioId: 22,
            embedding: [1, 0]
          }
        ];
      },
      async create() {
        tentouCriar = true;
        return null;
      }
    }
  };

  const prismaFake = {
    async $transaction(callback) {
      return callback(tx);
    }
  };

  const resultado =
    await criarAmostraFacialExclusiva({
      prisma: prismaFake,
      usuarioId: 10,
      embedding: [0, 1],
      embeddingsVerificacao: [
        [0.51, Math.sqrt(1 - 0.51 ** 2)]
      ],
      nome: "Principal"
    });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.motivo, "outro_perfil");
  assert.ok(resultado.similaridade >= 0.50);
  assert.equal(tentouCriar, false);
});



test("pacote facial mantém até três templates e aceita formato legado", () => {
  const pacote = criarPacoteTemplatesFaciais({
    inicial: [1, 0, 0],
    movimento: [0.98, 0.2, 0],
    final: [0.99, 0.01, 0]
  });

  assert.equal(pacote.versao, 2);
  assert.equal(pacote.templates.length, 3);
  assert.equal(extrairTemplatesFaciais([1, 0, 0]).length, 1);
  assert.equal(extrairTemplatesFaciais(pacote).length, 3);
});

test("login facial usa consenso entre múltiplos templates por identidade", () => {
  const faceA = {
    id: 1,
    usuarioId: 10,
    embedding: criarPacoteTemplatesFaciais({
      inicial: [1, 0, 0],
      movimento: [0.98, 0.2, 0],
      final: [0.999, 0.02, 0]
    })
  };

  const faceB = {
    id: 2,
    usuarioId: 20,
    embedding: criarPacoteTemplatesFaciais({
      inicial: [0.65, 0.76, 0],
      movimento: [0.62, 0.78, 0],
      final: [0.6, 0.8, 0]
    })
  };

  const resultado = classificarCorrespondenciaFacial({
    embedding: [1, 0, 0],
    faces: [faceA, faceB],
    threshold: 0.58,
    margemMinima: 0.08
  });

  assert.equal(resultado.status, "reconhecido");
  assert.equal(resultado.melhor.usuarioId, 10);
  assert.equal(resultado.melhor.quantidadeTemplates, 3);
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
  comandoJaFinalizado,
  normalizarStatusAck
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


test("ACK aceita somente status explícitos", () => {
  assert.equal(normalizarStatusAck("concluido"), "CONCLUIDO");
  assert.equal(normalizarStatusAck("FALHOU"), "FALHOU");
  assert.equal(normalizarStatusAck("OK"), null);
  assert.equal(normalizarStatusAck("CONCLUIDDO"), null);
  assert.equal(normalizarStatusAck(undefined), null);
});
