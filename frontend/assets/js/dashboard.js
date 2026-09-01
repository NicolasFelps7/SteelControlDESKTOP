
function mensagemSeguraApi(
  dados,
  fallback
) {
  const mensagem =
    String(
      dados?.mensagem ||
      dados?.erro ||
      ""
    );

  if (
    mensagem.includes("Invalid `prisma.") ||
    mensagem.includes("Unknown argument") ||
    mensagem.includes("PrismaClient") ||
    mensagem.includes("Available options")
  ) {
    return fallback;
  }

  return mensagem || fallback;
}


function prepararLogoParaTema(img) {
  if (!img) return;

  img.classList.remove("logo-monocromatica-escura");

  const analisar = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;

      const ctx = canvas.getContext(
        "2d",
        { willReadFrequently: true }
      );

      ctx.clearRect(0, 0, 48, 48);
      ctx.drawImage(img, 0, 0, 48, 48);

      const pixels =
        ctx.getImageData(0, 0, 48, 48).data;

      let validos = 0;
      let escuros = 0;
      let cinza = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 30) continue;

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        validos++;

        if ((r + g + b) / 3 < 95) {
          escuros++;
        }

        if (
          Math.max(r, g, b) -
          Math.min(r, g, b) <
          22
        ) {
          cinza++;
        }
      }

      if (!validos) return;

      img.classList.toggle(
        "logo-monocromatica-escura",
        escuros / validos > 0.62 &&
        cinza / validos > 0.72
      );
    } catch (_) {}
  };

  if (img.complete) analisar();
  else img.addEventListener("load", analisar, { once: true });
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ======================================================
// STEELCONTROL - DASHBOARD
// script.js
// ======================================================


// ======================================================
// CONFIGURAÇÕES GERAIS
// ======================================================

const API_URL =
  window.STEELCONTROL_API_URL;

const TOKEN_API =
  localStorage.getItem(
    "token"
  );


// ======================================================
// FETCH AUTENTICADO
// ======================================================

async function fetchAutenticado(
  url,
  options = {}
) {

  const headers =
    new Headers(
      options.headers || {}
    );


  if (TOKEN_API) {

    headers.set(
      "Authorization",
      `Bearer ${TOKEN_API}`
    );

  }


  if (
    options.body &&
    !headers.has(
      "Content-Type"
    ) &&
    !(options.body instanceof FormData)
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );

  }


  const resposta =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    );


  if (
    resposta.status === 401
  ) {

    limparSessao();

    window.location.href =
      "/app/login";

    throw new Error(
      "Sessão expirada."
    );

  }


  return resposta;
}


// ======================================================
// SESSÃO
// ======================================================

const autenticado =
  localStorage.getItem(
    "autenticado"
  );

const usuarioLogado =
  localStorage.getItem(
    "usuarioLogado"
  );

const nomeUsuario =
  localStorage.getItem(
    "nomeUsuario"
  );

const cargoUsuario =
  localStorage.getItem(
    "cargoUsuario"
  );


if (
  autenticado !== "true"
) {

  window.location.href =
    "/app/login";

}


// ======================================================
// LIMPAR SESSÃO
// ======================================================

function limparSessao() {

  localStorage.removeItem(
    "autenticado"
  );

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "usuarioLogado"
  );

  localStorage.removeItem(
    "nomeUsuario"
  );

  localStorage.removeItem(
    "cargoUsuario"
  );

  localStorage.removeItem(
    "empresa"
  );

  localStorage.removeItem(
    "maquinaId"
  );

  localStorage.removeItem(
    "maquinaSelecionada"
  );

  localStorage.removeItem(
    "setorSelecionado"
  );

}



function textoEstadoOperacao(
  chave,
  fallback
) {
  if (
    typeof pegarTexto ===
    "function"
  ) {
    const traduzido =
      pegarTexto(chave);

    if (
      traduzido &&
      traduzido !== chave
    ) {
      return traduzido;
    }
  }

  return fallback;
}


function formatarControlador(
  controlador
) {
  const tipos = {
    ESP32: "ESP32",
    DOBOT_MAGICIAN: "Dobot Magician",
    CLP_PLC: "CLP / PLC",
    CONTROLADOR_ROBOTICO:
      "Controlador robótico",
    CNC: "CNC",
    GATEWAY_INDUSTRIAL:
      "Gateway industrial",
    OUTRO: "Equipamento"
  };

  return (
    tipos[controlador] ||
    controlador ||
    "Equipamento"
  );
}

function obterPerfilOperacional(maquina) {
  const codigo = String(maquina?.controlador || "OUTRO").toUpperCase();
  const perfis = {
    ESP32: { nome: "ESP32 / IoT", titulo: "Operação e telemetria do ESP32", descricao: "Leituras, conectividade e atividade enviadas pelo dispositivo selecionado.", primario: "Processos contabilizados:", ciclos: "Ciclos informados:", metrica: "Qualidade do sinal", valor: m => m.estadoConexao?.qualidadeSinal ?? m.qualidadeSinal, unidade: "%", recursos: ["Sensores", "Wi-Fi / RSSI", "Heartbeat"], grafico: "Atividade do ESP32" },
    DOBOT_MAGICIAN: { nome: "Dobot Magician", titulo: "Operação do braço robótico", descricao: "Ciclos, manipulações e atividade operacional do Dobot selecionado.", primario: "Operações concluídas:", ciclos: "Ciclos do braço:", metrica: "Modo do gateway", valor: m => m.dadosExtrasAtuais?.dobot?.mode || m.integracaoMeta?.dobot?.mode, unidade: "", recursos: ["Movimentos", "Efetuador", "Fila segura"], grafico: "Operações do Dobot" },
    CLP_PLC: { nome: "CLP / PLC", titulo: "Produção controlada pelo PLC", descricao: "Produção, ciclos de processo e dados de automação da máquina selecionada.", primario: "Unidades produzidas:", ciclos: "Ciclos do processo:", metrica: "Tempo de scan", valor: m => m.dadosExtrasAtuais?.plc?.scanTimeMs, unidade: "ms", recursos: ["Processo", "I/O", "Registradores"], grafico: "Produção do PLC" },
    CONTROLADOR_ROBOTICO: { nome: "Controlador robótico", titulo: "Operação da célula robótica", descricao: "Produção e ciclos executados exclusivamente pela célula selecionada.", primario: "Operações concluídas:", ciclos: "Ciclos robóticos:", metrica: "Modo de operação", valor: m => m.dadosExtrasAtuais?.robot?.mode, unidade: "", recursos: ["Eixos", "Ferramenta", "Segurança"], grafico: "Ciclos robóticos" },
    CNC: { nome: "CNC / Usinagem", titulo: "Produção da máquina CNC", descricao: "Peças, ciclos e parâmetros de usinagem da máquina selecionada.", primario: "Peças produzidas:", ciclos: "Ciclos de usinagem:", metrica: "Rotação do spindle", valor: m => m.dadosExtrasAtuais?.cnc?.spindleRpm, unidade: "RPM", recursos: ["Spindle", "Avanço", "Programa"], grafico: "Peças usinadas" },
    GATEWAY_INDUSTRIAL: { nome: "Gateway industrial", titulo: "Operação do gateway industrial", descricao: "Fluxo de dados e atividade dos equipamentos integrados por este gateway.", primario: "Mensagens/processos:", ciclos: "Ciclos de comunicação:", metrica: "Dispositivos online", valor: m => m.dadosExtrasAtuais?.gateway?.devicesOnline, unidade: "disp.", recursos: ["Dispositivos", "Protocolos", "Tráfego"], grafico: "Atividade do gateway" },
    OUTRO: { nome: "Controlador genérico", titulo: "Produção da máquina", descricao: "Indicadores operacionais exclusivos do equipamento selecionado.", primario: "Total produzido:", ciclos: "Ciclos executados:", metrica: "Carga elétrica", valor: m => m.consumoEnergia, unidade: "%", recursos: ["Produção", "Telemetria", "Alertas"], grafico: "Produção da máquina" }
  };
  return perfis[codigo] || perfis.OUTRO;
}

function formatarValorOperacional(valor, unidade = "") {
  if (valor === null || valor === undefined || valor === "") return "Não configurado";
  return `${valor}${unidade ? ` ${unidade}` : ""}`;
}

function atualizarContextoMaquina(maquina) {
  const perfil = obterPerfilOperacional(maquina);
  const nome = maquina?.nome || localStorage.getItem("maquinaSelecionada") || "Máquina selecionada";
  const codigoEstado = String(maquina?.estadoConexao?.codigo || "OFFLINE").toUpperCase();
  const estadoTexto = codigoEstado === "CONECTADA" ? "Conectada" : codigoEstado === "INSTAVEL" ? "Instável" : maquina?.modoSimulacao !== false ? "Simulação" : "Offline";

  document.querySelectorAll("[data-machine-scope-name]").forEach(elemento => { elemento.textContent = nome; });
  document.querySelectorAll("[data-machine-scope-controller]").forEach(elemento => { elemento.textContent = perfil.nome.toUpperCase(); });
  document.querySelectorAll("[data-machine-scope-state]").forEach(elemento => {
    elemento.textContent = estadoTexto;
    elemento.className = `machine-scope-state ${codigoEstado === "CONECTADA" ? "online" : codigoEstado === "INSTAVEL" ? "unstable" : ""}`;
  });

  const definir = (id, texto) => { const elemento = document.getElementById(id); if (elemento) elemento.textContent = texto; };
  definir("machineProductionTitle", perfil.titulo);
  definir("machineProductionDescription", perfil.descricao);
  definir("productionPrimaryLabel", perfil.primario);
  definir("productionCycleLabel", perfil.ciclos);
  definir("productionControllerMetricLabel", perfil.metrica);
  definir("productionControllerMetric", formatarValorOperacional(perfil.valor(maquina), perfil.unidade));
  definir("productionSystemDescription", `Módulos operacionais compatíveis com ${perfil.nome}. Dados ausentes permanecem identificados como não configurados.`);
  definir("machineMaintenanceTitle", `Manutenção — ${nome}`);
  definir("machineMaintenanceDescription", `Plano preventivo, intervenções e histórico técnico exclusivos do ${perfil.nome}.`);
  definir("machineLogsTitle", `Logs — ${nome}`);
  definir("machineLogsDescription", `Eventos do ${perfil.nome} vinculados somente à máquina selecionada.`);
  definir("machineLogsOrigin", perfil.nome);

  const recursos = document.getElementById("productionCompatibilityList");
  if (recursos) recursos.innerHTML = perfil.recursos.map(item => `<span>${escaparHtml(item)}</span>`).join("");
  if (graficoProducao2?.data?.datasets?.[0]) {
    graficoProducao2.data.datasets[0].label = perfil.grafico;
    graficoProducao2.update();
  }
}


function obterEstadoOperacao(
  maquina
) {
  if (
    maquina?.modoSimulacao !==
    false
  ) {
    return {
      codigo: "SIMULACAO",
      classe: "",
      icone: "fa-flask",
      titulo:
        textoEstadoOperacao(
          "simulationMode",
          "Modo simulação"
        ),
      detalhe:
        textoEstadoOperacao(
          "simulationGeneratedData",
          "Dados gerados pelo SteelControl"
        )
    };
  }

  const codigo =
    String(
      maquina?.estadoConexao?.codigo ||
      ""
    )
      .trim()
      .toUpperCase();

  if (
    codigo === "CONECTADA"
  ) {
    return {
      codigo: "CONECTADA",
      classe: "real-mode",
      icone: "fa-satellite-dish",
      titulo:
        textoEstadoOperacao(
          "machineConnected",
          "Máquina conectada"
        ),
      detalhe:
        `${formatarControlador(
          maquina?.controlador
        )} • Dados em tempo real`
    };
  }

  if (
    codigo === "INSTAVEL"
  ) {
    return {
      codigo: "INSTAVEL",
      classe: "unstable-mode",
      icone: "fa-signal",
      titulo: "Conexão instável",
      detalhe: maquina?.estadoConexao?.detalhe || "Telemetria chegando com atraso"
    };
  }

  return {
    codigo: "OFFLINE",
    classe: "offline-mode",
    icone:
      "fa-plug-circle-xmark",
    titulo:
      textoEstadoOperacao(
        "machineOffline",
        "Máquina offline"
      ),
    detalhe:
      maquina?.statusConexao ===
      "Não configurada"
        ? textoEstadoOperacao(
            "connectionNotConfigured",
            "Conexão não configurada"
          )
        : textoEstadoOperacao(
            "awaitingRealTelemetry",
            "Aguardando telemetria real"
          )
  };
}


function atualizarBadgeModoOperacao(maquina) {
  const badge =
    document.getElementById(
      "simulationModeBadge"
    );

  if (!badge) {
    return;
  }

  const estado =
    obterEstadoOperacao(
      maquina
    );

  badge.hidden = false;

  badge.classList.remove(
    "real-mode",
    "offline-mode",
    "unstable-mode"
  );

  if (estado.classe) {
    badge.classList.add(
      estado.classe
    );
  }

  badge.innerHTML = `
    <i class="fa-solid ${estado.icone}"></i>
    <span class="operation-badge-copy">
      <strong>${estado.titulo}</strong>
      <small>${estado.detalhe}</small>
    </span>
  `;

  badge.title =
    `${estado.titulo} — ${estado.detalhe}`;
}


// ======================================================
// ELEMENTOS DO DASHBOARD
// ======================================================

const temperaturaEl =
  document.getElementById(
    "temperatura"
  );

const producaoEl =
  document.getElementById(
    "producao"
  );

const ciclosEl =
  document.getElementById(
    "ciclos"
  );

const energiaEl =
  document.getElementById(
    "energia"
  );

const statusEl =
  document.getElementById(
    "statusMaquina"
  );

const descricaoStatusEl =
  document.getElementById(
    "descricaoStatus"
  );

const manutencaoResumoEl =
  document.getElementById(
    "manutencaoResumo"
  );


// ======================================================
// MÁQUINA
// ======================================================

const nomeMaquinaEl =
  document.getElementById(
    "nomeMaquina"
  );

const dashboardNomeMaquinaEl =
  document.getElementById(
    "dashboardNomeMaquina"
  );

const dashboardSetorMaquinaEl =
  document.getElementById(
    "dashboardSetorMaquina"
  );

const overviewMachineNameEl =
  document.getElementById(
    "overviewMachineName"
  );

const overviewMachineMetaEl =
  document.getElementById(
    "overviewMachineMeta"
  );

const setorMaquinaEl =
  document.getElementById(
    "setorMaquina"
  );

const statusMaquinaListaEl =
  document.getElementById(
    "statusMaquinaLista"
  );


// ======================================================
// PRODUÇÃO
// ======================================================

const totalProduzidoEl =
  document.getElementById(
    "totalProduzido"
  );

const totalCiclosEl =
  document.getElementById(
    "totalCiclos"
  );

const statusProducaoEl =
  document.getElementById(
    "statusProducao"
  );


// ======================================================
// MANUTENÇÃO
// ======================================================

const ultimaManutencaoEl =
  document.getElementById(
    "ultimaManutencao"
  );

const proximaManutencaoEl =
  document.getElementById(
    "proximaManutencao"
  );

const statusManutencaoEl =
  document.getElementById(
    "statusManutencao"
  );

const ciclosManutencaoEl =
  document.getElementById(
    "ciclosManutencao"
  );


// ======================================================
// LOGS E ALERTAS
// ======================================================

const listaLogsEl =
  document.getElementById(
    "listaLogs"
  );

const listaAlertasEl =
  document.getElementById(
    "listaAlertas"
  );


// ======================================================
// FORMULÁRIO DE MANUTENÇÃO
// ======================================================

const formManutencao =
  document.getElementById(
    "formManutencao"
  );

const tipoManutencaoEl =
  document.getElementById(
    "tipoManutencao"
  );

const tecnicoManutencaoEl =
  document.getElementById(
    "tecnicoManutencao"
  );

const descricaoManutencaoEl =
  document.getElementById(
    "descricaoManutencao"
  );

const listaManutencoesEl =
  document.getElementById(
    "listaManutencoes"
  );

const mensagemManutencaoEl =
  document.getElementById(
    "mensagemManutencao"
  );


// ======================================================
// USUÁRIO
// ======================================================

const nomeUsuarioEl =
  document.getElementById(
    "nomeUsuario"
  );

const cargoUsuarioEl =
  document.getElementById(
    "cargoUsuario"
  );


function usuarioEhAdministrador() {
  const cargoDireto =
    localStorage.getItem("cargoUsuario") ||
    localStorage.getItem("cargo") ||
    "";

  let cargoObjeto = "";

  try {
    const usuario =
      JSON.parse(
        localStorage.getItem("usuario") ||
        localStorage.getItem("usuarioLogado") ||
        "{}"
      );

    cargoObjeto =
      usuario?.cargo ||
      usuario?.cargoTela ||
      "";
  } catch (_) {}

  const cargoFinal =
    String(cargoDireto || cargoObjeto)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  return (
    cargoFinal === "ADMINISTRADOR" ||
    cargoFinal === "ADMIN"
  );
}

function usuarioPodeRegistrarManutencao() {
  const cargoFinal =
    String(
      localStorage.getItem("cargoUsuario") ||
      localStorage.getItem("cargo") ||
      ""
    )
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  return [
    "ADMINISTRADOR",
    "ADMIN",
    "SUPERVISOR",
    "TECNICO"
  ].includes(cargoFinal);
}


// ======================================================
// CONFIGURAÇÕES
// ======================================================

const idiomaConfig =
  document.getElementById(
    "idiomaConfig"
  );

const temaConfig =
  document.getElementById(
    "temaConfig"
  );


// ======================================================
// VISÃO GERAL DA OPERAÇÃO
// ======================================================

const totalMaquinasEmpresaEl =
  document.getElementById(
    "totalMaquinasEmpresa"
  );

const totalMaquinasOperacaoEl =
  document.getElementById(
    "totalMaquinasOperacao"
  );

const totalMaquinasAlertaEl =
  document.getElementById(
    "totalMaquinasAlerta"
  );

const totalMaquinasManutencaoEl =
  document.getElementById(
    "totalMaquinasManutencao"
  );

const saudeOperacaoValorEl =
  document.getElementById(
    "saudeOperacaoValor"
  );

const saudeOperacaoTextoEl =
  document.getElementById(
    "saudeOperacaoTexto"
  );

const saudeOperacaoBarraEl =
  document.getElementById(
    "saudeOperacaoBarra"
  );

const producaoTotalEmpresaEl =
  document.getElementById(
    "producaoTotalEmpresa"
  );

const energiaMediaEmpresaEl =
  document.getElementById(
    "energiaMediaEmpresa"
  );

const ciclosTotalEmpresaEl =
  document.getElementById(
    "ciclosTotalEmpresa"
  );

const temperaturaMediaEmpresaEl =
  document.getElementById(
    "temperaturaMediaEmpresa"
  );

const operationUpdateBadgeEl =
  document.getElementById(
    "operationUpdateBadge"
  );


// ======================================================
// EXIBIR USUÁRIO
// ======================================================

if (nomeUsuarioEl) {

  nomeUsuarioEl.textContent =
    nomeUsuario ||
    usuarioLogado ||
    (
      typeof pegarTexto ===
      "function"

        ? pegarTexto(
            "usuario"
          )

        : "Usuário"
    );

}


if (cargoUsuarioEl) {

  cargoUsuarioEl.textContent =
    cargoUsuario ||
    (
      typeof pegarTexto ===
      "function"

        ? pegarTexto(
            "cargo"
          )

        : "Cargo"
    );

}


// ======================================================
// PERMISSÃO VISUAL DA MANUTENÇÃO
// ======================================================

const maintenanceAdminBadge =
  document.getElementById("maintenanceAdminBadge");

if (maintenanceAdminBadge) {
  maintenanceAdminBadge.hidden =
    !usuarioEhAdministrador();
}

const maintenanceFormPanel =
  document.querySelector(
    ".maintenance-form-panel"
  );

if (
  maintenanceFormPanel &&
  !usuarioPodeRegistrarManutencao()
) {
  maintenanceFormPanel.remove();
}


// ======================================================
// DADOS DOS GRÁFICOS
// ======================================================

let dadosGrafico = [];

let dadosTemperatura = [];

let dadosEnergia = [];

let labelsGrafico = [];

let maquinaAtual = null;


// ======================================================
// ELEMENTOS DOS GRÁFICOS
// ======================================================

const ctxProducao =
  document.getElementById(
    "graficoProducao"
  );

const ctxProducao2 =
  document.getElementById(
    "graficoProducao2"
  );

const ctxTemperatura =
  document.getElementById(
    "graficoTemperatura"
  );

const ctxEnergia =
  document.getElementById(
    "graficoEnergia"
  );


// ======================================================
// INSTÂNCIAS DOS GRÁFICOS
// ======================================================

let graficoProducao = null;

let graficoProducao2 = null;

let graficoTemperatura = null;

let graficoEnergia = null;


// ======================================================
// GRÁFICO PRODUÇÃO
// ======================================================

if (
  ctxProducao &&
  typeof Chart !==
  "undefined"
) {

  graficoProducao =
    new Chart(
      ctxProducao,
      {

        type:
          "line",

        data: {

          labels:
            labelsGrafico,

          datasets: [
            {

              label:
                typeof pegarTexto ===
                "function"

                  ? pegarTexto(
                      "producaoCard"
                    )

                  : "Produção",

              data:
                dadosGrafico,

              borderWidth:
                3,

              tension:
                0.4

            }
          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            y: {

              beginAtZero:
                true

            }

          }

        }

      }
    );

}


// ======================================================
// GRÁFICO PRODUÇÃO 2
// ======================================================

if (
  ctxProducao2 &&
  typeof Chart !==
  "undefined"
) {

  graficoProducao2 =
    new Chart(
      ctxProducao2,
      {

        type:
          "bar",

        data: {

          labels:
            labelsGrafico,

          datasets: [
            {

              label:
                typeof pegarTexto ===
                "function"

                  ? pegarTexto(
                      "graficoProducao"
                    )

                  : "Produção",

              data:
                dadosGrafico,

              borderWidth:
                1

            }
          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            y: {

              beginAtZero:
                true

            }

          }

        }

      }
    );

}


// ======================================================
// GRÁFICO TEMPERATURA
// ======================================================

if (
  ctxTemperatura &&
  typeof Chart !==
  "undefined"
) {

  graficoTemperatura =
    new Chart(
      ctxTemperatura,
      {

        type:
          "line",

        data: {

          labels:
            labelsGrafico,

          datasets: [
            {

              label:
                typeof pegarTexto ===
                "function"

                  ? pegarTexto(
                      "temperaturaMaquina"
                    )

                  : "Temperatura da máquina",

              data:
                dadosTemperatura,

              borderWidth:
                3,

              tension:
                0.4

            }
          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            y: {

              beginAtZero:
                true

            }

          }

        }

      }
    );

}


// ======================================================
// GRÁFICO ENERGIA
// ======================================================

if (
  ctxEnergia &&
  typeof Chart !==
  "undefined"
) {

  graficoEnergia =
    new Chart(
      ctxEnergia,
      {

        type:
          "line",

        data: {

          labels:
            labelsGrafico,

          datasets: [
            {

              label:
                typeof pegarTexto ===
                "function"

                  ? pegarTexto(
                      "consumoEnergia"
                    )

                  : "Carga elétrica (%)",

              data:
                dadosEnergia,

              borderWidth:
                3,

              tension:
                0.4

            }
          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            y: {

              beginAtZero:
                true,

              max:
                100

            }

          }

        }

      }
    );

}


// ======================================================
// CONFIGURAR SELECTS
// ======================================================

function configurarSelects() {

  if (idiomaConfig) {

    idiomaConfig.value =
      localStorage.getItem(
        "idiomaSistema"
      ) || "pt";


    idiomaConfig.addEventListener(
      "change",
      function () {

        if (
          typeof trocarIdioma ===
          "function"
        ) {

          trocarIdioma(
            idiomaConfig.value
          );

        }

      }
    );

  }


  if (temaConfig) {

    temaConfig.value =
      localStorage.getItem(
        "temaSistema"
      ) || "claro";


    temaConfig.addEventListener(
      "change",
      function () {

        if (
          typeof trocarTema ===
          "function"
        ) {

          trocarTema(
            temaConfig.value
          );

        }

      }
    );

  }

}


// ======================================================
// BUSCAR DADOS DA MÁQUINA
// ======================================================

async function buscarDados() {

  try {

    const maquinaId =
      localStorage.getItem(
        "maquinaId"
      );

    if (!maquinaId) {
      window.location.href =
        "/app/maquinas";
      return;
    }

    // Consulta inicial/forçada sem gerar telemetria.
    // O industrial-runtime.js é o único responsável por:
    // - SSE como canal principal;
    // - polling somente como fallback;
    // - geração periódica quando a máquina está em simulação.
    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas/${maquinaId}`
      );

    if (!resposta.ok) {
      throw new Error(
        "Erro na resposta da API."
      );
    }

    const maquina =
      await resposta.json();

    maquinaAtual =
      maquina;

    atualizarTela(
      maquina
    );

    atualizarGrafico(
      maquina
    );

  } catch (erro) {

    console.error(
      "Erro ao buscar dados:",
      erro
    );

    if (statusEl) {
      statusEl.textContent =
        typeof pegarTexto ===
        "function"
          ? pegarTexto(
              "apiOffline"
            )
          : "API offline";

      statusEl.className =
        "status-box status-alerta";
    }

    if (descricaoStatusEl) {
      descricaoStatusEl.textContent =
        typeof pegarTexto ===
        "function"
          ? pegarTexto(
              "erroApiTexto"
            )
          : "Não foi possível conectar ao servidor.";
    }
  }
}


// ======================================================
// TRADUZIR STATUS
// ======================================================

function traduzirStatus(
  status
) {

  if (
    typeof pegarTexto !==
    "function"
  ) {

    return status;

  }


  if (
    status ===
    "Ligada"
  ) {

    return pegarTexto(
      "ligado"
    );

  }


  if (
    status ===
    "Alerta" ||
    status ===
    "Parada de segurança"
  ) {

    return pegarTexto(
      "alertaStatus"
    );

  }


  if (
    status ===
    "Manutenção"
  ) {

    return pegarTexto(
      "manutencaoStatus"
    );

  }


  return status;

}


// ======================================================
// TRADUZIR MANUTENÇÃO
// ======================================================

function traduzirManutencao(
  texto
) {

  if (!texto) {

    return "";

  }


  if (
    typeof pegarTexto !==
    "function"
  ) {

    return texto;

  }


  const normalizado =
    texto.toLowerCase();


  if (
    normalizado.includes(
      "normal"
    )
  ) {

    return pegarTexto(
      "normal"
    );

  }


  if (
    normalizado.includes(
      "superaquecimento"
    )
  ) {

    return pegarTexto(
      "verificarSuperaquecimento"
    );

  }


  if (
    normalizado.includes(
      "energia"
    )
  ) {

    return pegarTexto(
      "verificarEnergia"
    );

  }


  if (
    normalizado.includes(
      "preventiva"
    )
  ) {

    return pegarTexto(
      "manutencaoPreventivaNecessaria"
    );

  }


  if (
    normalizado.includes(
      "corretiva"
    )
  ) {

    return pegarTexto(
      "corretiva"
    );

  }


  return texto;

}


// ======================================================
// ATUALIZAR TELA
// ======================================================

function atualizarTela(
  maquina
) {

  atualizarBadgeModoOperacao(maquina);

  atualizarContextoMaquina(maquina);


  const maquinaSelecionada =
    localStorage.getItem(
      "maquinaSelecionada"
    );


  const setorSelecionado =
    localStorage.getItem(
      "setorSelecionado"
    );


  if (temperaturaEl) {

    temperaturaEl.textContent =
      `${maquina.temperatura} °C`;

  }


  if (producaoEl) {

    producaoEl.textContent =
      maquina.producao;

  }


  if (ciclosEl) {

    ciclosEl.textContent =
      maquina.ciclos;

  }


  if (energiaEl) {

    energiaEl.textContent =
      `${maquina.consumoEnergia}%`;

  }


  if (statusEl) {

    statusEl.textContent =
      traduzirStatus(
        maquina.status
      );

  }


  if (
    manutencaoResumoEl
  ) {

    manutencaoResumoEl.textContent =
      traduzirManutencao(
        maquina.manutencao
      );

  }


  const nomeAtual =
    maquinaSelecionada ||
    maquina.nome ||
    "Máquina selecionada";

  const setorAtual =
    setorSelecionado ||
    maquina.setor ||
    "Monitoramento em tempo real";


  if (nomeMaquinaEl) {

    nomeMaquinaEl.textContent =
      nomeAtual;

  }


  if (dashboardNomeMaquinaEl) {

    dashboardNomeMaquinaEl.textContent =
      nomeAtual;

  }


  if (dashboardSetorMaquinaEl) {

    dashboardSetorMaquinaEl.textContent =
      setorAtual;

  }


  if (overviewMachineNameEl) {

    overviewMachineNameEl.textContent =
      nomeAtual;

  }


  if (overviewMachineMetaEl) {

    const estadoOperacao =
      obterEstadoOperacao(
        maquina
      );

    overviewMachineMetaEl.textContent =
      `${setorAtual} • ${estadoOperacao.titulo}`;

  }


  if (setorMaquinaEl) {

    setorMaquinaEl.textContent =
      setorAtual;

  }


  if (
    statusMaquinaListaEl
  ) {

    statusMaquinaListaEl.textContent =
      traduzirStatus(
        maquina.status
      );

  }


  if (
    totalProduzidoEl
  ) {

    totalProduzidoEl.textContent =
      maquina.producao;

  }


  if (
    totalCiclosEl
  ) {

    totalCiclosEl.textContent =
      maquina.ciclos;

  }


  if (
    statusProducaoEl
  ) {

    statusProducaoEl.textContent =
      traduzirStatus(
        maquina.status
      );

  }


  if (
    ultimaManutencaoEl
  ) {

    ultimaManutencaoEl.textContent =
      maquina.ultimaManutencao;

  }


  if (
    proximaManutencaoEl
  ) {

    proximaManutencaoEl.textContent =
      maquina.proximaManutencao;

  }


  if (
    statusManutencaoEl
  ) {

    statusManutencaoEl.textContent =
      traduzirManutencao(
        maquina.manutencao
      );

  }


  if (
    ciclosManutencaoEl
  ) {

    ciclosManutencaoEl.textContent =
      maquina.ciclos;

  }


  atualizarStatusVisual(
    maquina.status
  );


  atualizarDescricaoStatus(
    maquina
  );


  atualizarLogs(
    maquina.logs || [],
    maquina
  );


  atualizarAlertas(
    maquina.alertas || []
  );

}


// ======================================================
// STATUS VISUAL
// ======================================================

function atualizarStatusVisual(
  status
) {

  if (!statusEl) {

    return;

  }


  statusEl.className =
    "status-box";


  if (
    statusMaquinaListaEl
  ) {

    statusMaquinaListaEl.style.background =
      "#dcfce7";

    statusMaquinaListaEl.style.color =
      "#166534";

  }


  if (
    status ===
    "Alerta"
  ) {

    statusEl.classList.add(
      "status-alerta"
    );


    if (
      statusMaquinaListaEl
    ) {

      statusMaquinaListaEl.style.background =
        "#fee2e2";

      statusMaquinaListaEl.style.color =
        "#991b1b";

    }

  }


  if (
    status ===
    "Manutenção"
  ) {

    statusEl.classList.add(
      "status-manutencao"
    );


    if (
      statusMaquinaListaEl
    ) {

      statusMaquinaListaEl.style.background =
        "#fef3c7";

      statusMaquinaListaEl.style.color =
        "#92400e";

    }

  }

}


// ======================================================
// DESCRIÇÃO DO STATUS
// ======================================================

function atualizarDescricaoStatus(
  maquina
) {

  if (
    !descricaoStatusEl
  ) {

    return;

  }


  if (
    typeof pegarTexto !==
    "function"
  ) {

    descricaoStatusEl.textContent =
      maquina.status;

    return;

  }


  if (
    maquina.status ===
    "Parada de segurança"
  ) {

    descricaoStatusEl.textContent =
      maquina.motivoParada ||
      "Parada de segurança ativa. Normalize a condição antes de liberar o equipamento.";

  } else if (
    maquina.status ===
    "Alerta"
  ) {

    descricaoStatusEl.textContent =
      pegarTexto(
        "statusAlertaTexto"
      );

  } else if (
    maquina.status ===
    "Manutenção"
  ) {

    descricaoStatusEl.textContent =
      pegarTexto(
        "statusManutencaoTexto"
      );

  } else {

    descricaoStatusEl.textContent =
      pegarTexto(
        "statusOkTexto"
      );

  }

}


// ======================================================
// LOGS
// ======================================================

function atualizarLogs(
  logs,
  maquina = maquinaAtual
) {

  if (!listaLogsEl) {

    return;

  }


  listaLogsEl.innerHTML =
    "";


  const ultimosLogs =
    logs
      .slice(-15)
      .reverse();

  const contador = document.getElementById("machineLogsCount");
  if (contador) contador.textContent = String(ultimosLogs.length);


  if (
    ultimosLogs.length ===
    0
  ) {

    listaLogsEl.innerHTML =
      `<li>${
        typeof pegarTexto ===
        "function"

          ? pegarTexto(
              "nenhumLog"
            )

          : "Nenhum log encontrado."
      }</li>`;

    return;

  }


  ultimosLogs.forEach(
    log => {

      const li =
        document.createElement(
          "li"
        );


      const mensagem = typeof log === "string" ? log : (log.mensagem || JSON.stringify(log));
      const normalizada = mensagem.toLowerCase();
      const tipo = /erro|falha|crític|parada/.test(normalizada) ? "error" : /alerta|atenção|instável|manutenção/.test(normalizada) ? "warning" : /conect|sucesso|iniciad|normal/.test(normalizada) ? "success" : "info";
      const icone = tipo === "error" ? "fa-circle-xmark" : tipo === "warning" ? "fa-triangle-exclamation" : tipo === "success" ? "fa-circle-check" : "fa-terminal";
      li.className = `log-${tipo}`;
      li.innerHTML = `<span class="machine-log-icon"><i class="fa-solid ${icone}"></i></span><span class="machine-log-copy"><strong>${escaparHtml(obterPerfilOperacional(maquina).nome)}</strong><span>${escaparHtml(mensagem)}</span></span>`;


      listaLogsEl.appendChild(
        li
      );

    }
  );

}


// ======================================================
// ALERTAS
// ======================================================

function atualizarAlertas(
  alertas
) {

  if (
    !listaAlertasEl
  ) {

    return;

  }


  listaAlertasEl.innerHTML =
    "";


  const ultimosAlertas =
    alertas
      .slice(-15)
      .reverse();


  if (
    ultimosAlertas.length ===
    0
  ) {

    listaAlertasEl.innerHTML =
      `<li>${
        typeof pegarTexto ===
        "function"

          ? pegarTexto(
              "nenhumAlerta"
            )

          : "Nenhum alerta encontrado."
      }</li>`;

    return;

  }


  ultimosAlertas.forEach(
    alerta => {

      const li =
        document.createElement(
          "li"
        );


      li.classList.add(
        "alerta"
      );


      if (
        typeof alerta ===
        "string"
      ) {

        li.textContent =
          alerta;

      } else {

        const data =
          alerta.data ||
          alerta.criadoEm ||
          "";


        li.textContent =
          `${data ? `[${data}] ` : ""}${alerta.tipo || "Alerta"}: ${alerta.mensagem || ""}`;

      }


      listaAlertasEl.appendChild(
        li
      );

    }
  );

}


// ======================================================
// ATUALIZAR GRÁFICOS
// ======================================================

function atualizarGrafico(
  maquina
) {

  const horario =
    new Date()
      .toLocaleTimeString();


  labelsGrafico.push(
    horario
  );


  dadosGrafico.push(
    Number(
      maquina.producao ||
      0
    )
  );


  dadosTemperatura.push(
    Number(
      maquina.temperatura ||
      0
    )
  );


  dadosEnergia.push(
    Number(
      maquina.consumoEnergia ||
      0
    )
  );


  if (
    labelsGrafico.length >
    8
  ) {

    labelsGrafico.shift();

    dadosGrafico.shift();

    dadosTemperatura.shift();

    dadosEnergia.shift();

  }


  graficoProducao
    ?.update();


  graficoProducao2
    ?.update();


  graficoTemperatura
    ?.update();


  graficoEnergia
    ?.update();

}


// ======================================================
// CARREGAR MANUTENÇÕES
// ======================================================

async function carregarManutencoes() {

  if (
    !listaManutencoesEl
  ) {

    return;

  }


  const maquinaId =
    localStorage.getItem(
      "maquinaId"
    ) || 1;


  try {

    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas/${maquinaId}/manutencoes`
      );


    if (
      !resposta.ok
    ) {

      throw new Error(
        "Erro ao carregar manutenções."
      );

    }


    const manutencoes =
      await resposta.json();


    listaManutencoesEl.innerHTML =
      "";


    if (
      !Array.isArray(
        manutencoes
      ) ||
      manutencoes.length ===
      0
    ) {

      listaManutencoesEl.innerHTML =
        `<li>${
          typeof pegarTexto ===
          "function"

            ? pegarTexto(
                "nenhumaManutencao"
              )

            : "Nenhuma manutenção encontrada."
        }</li>`;

      return;

    }


    manutencoes
      .slice()
      .reverse()
      .forEach(
        item => {

          const li =
            document.createElement(
              "li"
            );


          const data =
            item.data ||
            (
              item.criadaEm

                ? new Date(
                    item.criadaEm
                  )
                    .toLocaleDateString(
                      "pt-BR"
                    )

                : "-"
            );


          const horario =
            item.horario ||
            (
              item.criadaEm

                ? new Date(
                    item.criadaEm
                  )
                    .toLocaleTimeString(
                      "pt-BR",
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit"
                      }
                    )

                : ""
            );


          const tipoNormalizado =
            String(item.tipo || "")
              .trim()
              .toLowerCase();

          const textoTipo =
            typeof pegarTexto === "function"
              ? pegarTexto(
                  tipoNormalizado === "preventiva"
                    ? "preventiva"
                    : tipoNormalizado === "corretiva"
                      ? "corretiva"
                      : "tipoManutencao"
                )
              : item.tipo;

          const tecnicoLabel =
            typeof pegarTexto === "function"
              ? pegarTexto("maintenanceTechnician")
              : "Técnico";

          const dataLabel =
            typeof pegarTexto === "function"
              ? pegarTexto("maintenanceDate")
              : "Data";

          const atLabel =
            typeof pegarTexto === "function"
              ? pegarTexto("maintenanceAt")
              : "às";

          const deleteTitle =
            typeof pegarTexto === "function"
              ? pegarTexto("maintenanceDelete")
              : "Excluir registro de manutenção";

          li.innerHTML = `
            <div class="maintenance-history-content">
              <div class="maintenance-history-topline">
                <strong>${escaparHtml(textoTipo)}</strong>
                <span class="maintenance-history-id">#${escaparHtml(item.id)}</span>
              </div>

              <div class="maintenance-history-meta">
                <span>
                  <i class="fa-solid fa-user-gear"></i>
                  ${escaparHtml(tecnicoLabel)}: ${escaparHtml(item.tecnico)}
                </span>

                <span>
                  <i class="fa-regular fa-calendar"></i>
                  ${escaparHtml(dataLabel)}: ${escaparHtml(data)}
                  ${horario ? `${escaparHtml(atLabel)} ${escaparHtml(horario)}` : ""}
                </span>
              </div>

              <p>${escaparHtml(item.descricao)}</p>
            </div>

            ${
              usuarioEhAdministrador()
                ? `
                  <button
                    type="button"
                    class="maintenance-delete-btn"
                    title="${escaparHtml(deleteTitle)}"
                    aria-label="${escaparHtml(deleteTitle)}"
                    data-maintenance-id="${escaparHtml(item.id)}"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                `
                : ""
            }
          `;

          li
            .querySelector(
              ".maintenance-delete-btn"
            )
            ?.addEventListener(
              "click",
              async () => {
                await excluirManutencao(
                  item.id
                );
              }
            );


          listaManutencoesEl
            .appendChild(
              li
            );

        }
      );


  } catch (erro) {

    console.error(
      "Erro ao carregar manutenções:",
      erro
    );


    listaManutencoesEl.innerHTML =
      `
        <li>
          Erro ao carregar histórico.
        </li>
      `;

  }

}


// ======================================================
// EXCLUIR MANUTENÇÃO
// SOMENTE ADMINISTRADOR
// ======================================================

async function excluirManutencao(
  manutencaoId
) {
  if (!usuarioEhAdministrador()) {
    alert(
      typeof pegarTexto === "function"
        ? pegarTexto("maintenanceOnlyAdminDelete")
        : "Somente administradores podem excluir registros de manutenção."
    );
    return;
  }

  const maquinaId =
    localStorage.getItem("maquinaId");

  if (!maquinaId) {
    alert(
      typeof pegarTexto === "function"
        ? pegarTexto("maintenanceNoMachine")
        : "Selecione uma máquina antes de excluir o registro."
    );
    return;
  }

  const confirmar =
    window.confirm(
      typeof pegarTexto === "function"
        ? pegarTexto("maintenanceDeleteConfirm")
        : "Deseja excluir este registro de manutenção? Esta ação não pode ser desfeita."
    );

  if (!confirmar) return;

  const botao =
    document.querySelector(
      `[data-maintenance-id="${manutencaoId}"]`
    );

  const htmlAnterior =
    botao?.innerHTML;

  if (botao) {
    botao.disabled = true;
    botao.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i>';
  }

  try {
    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas/${maquinaId}/manutencoes/${manutencaoId}`,
        { method: "DELETE" }
      );

    const dados =
      await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        mensagemSeguraApi(
          dados,
          typeof pegarTexto === "function"
            ? pegarTexto("maintenanceDeleteError")
            : "Não foi possível excluir o registro."
        )
      );
    }

    if (mensagemManutencaoEl) {
      mensagemManutencaoEl.textContent =
        dados.mensagem ||
        (
          typeof pegarTexto === "function"
            ? pegarTexto("maintenanceDeleteSuccess")
            : "Registro excluído com sucesso."
        );

      mensagemManutencaoEl.className =
        "mensagem-manutencao sucesso";
    }

    await carregarManutencoes();
    await buscarDados();

  } catch (erro) {
    console.error(
      "Erro ao excluir manutenção:",
      erro
    );

    if (mensagemManutencaoEl) {
      mensagemManutencaoEl.textContent =
        erro.message ||
        (
          typeof pegarTexto === "function"
            ? pegarTexto("maintenanceDeleteError")
            : "Erro ao excluir manutenção."
        );

      mensagemManutencaoEl.className =
        "mensagem-manutencao erro";
    } else {
      alert(erro.message);
    }

    if (botao) {
      botao.disabled = false;
      botao.innerHTML =
        htmlAnterior ||
        '<i class="fa-solid fa-trash-can"></i>';
    }
  }
}


// ======================================================
// CADASTRAR MANUTENÇÃO
// ======================================================

if (formManutencao) {

  formManutencao.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!usuarioPodeRegistrarManutencao()) {
        if (mensagemManutencaoEl) {
          mensagemManutencaoEl.textContent =
            "Seu perfil possui acesso somente à consulta do histórico de manutenção.";
          mensagemManutencaoEl.className =
            "mensagem-manutencao erro";
        }
        return;
      }


      const maquinaId =
        localStorage.getItem(
          "maquinaId"
        );

      if (!maquinaId) {
        window.location.href =
          "/app/maquinas";
        return;
      }


      const tipo =
        tipoManutencaoEl
          ?.value;


      const tecnico =
        tecnicoManutencaoEl
          ?.value
          .trim();


      const descricao =
        descricaoManutencaoEl
          ?.value
          .trim();


      if (
        !tipo ||
        !tecnico ||
        !descricao
      ) {

        if (
          mensagemManutencaoEl
        ) {

          mensagemManutencaoEl.textContent =
            "Preencha todos os campos.";


          mensagemManutencaoEl.className =
            "mensagem-manutencao erro";

        }


        return;

      }


      try {

        const resposta =
          await fetchAutenticado(
            `${API_URL}/maquinas/${maquinaId}/manutencoes`,
            {

              method:
                "POST",

              body:
                JSON.stringify(
                  {
                    tipo,
                    tecnico,
                    descricao
                  }
                )

            }
          );


        const dados =
          await resposta
            .json()
            .catch(
              () => ({})
            );


        if (
          !resposta.ok
        ) {

          throw new Error(
            dados.mensagem ||
            "Erro ao cadastrar manutenção."
          );

        }


        if (
          mensagemManutencaoEl
        ) {

          mensagemManutencaoEl.textContent =
            "Manutenção cadastrada com sucesso!";


          mensagemManutencaoEl.className =
            "mensagem-manutencao sucesso";

        }


        formManutencao.reset();


        await carregarManutencoes();


        await buscarDados();


        await carregarVisaoGeralOperacao();


      } catch (erro) {

        console.error(
          erro
        );


        if (
          mensagemManutencaoEl
        ) {

          mensagemManutencaoEl.textContent =
            erro.message;


          mensagemManutencaoEl.className =
            "mensagem-manutencao erro";

        }

      }

    }
  );

}


// ======================================================
// MINHA EMPRESA - RESUMO
// ======================================================

async function carregarResumoEmpresa() {

  const nomeEl =
    document.getElementById(
      "configEmpresaNome"
    );

  const cnpjEl =
    document.getElementById(
      "configEmpresaCnpj"
    );

  const logoConfigEl =
    document.getElementById(
      "configEmpresaLogo"
    );

  const totalFuncionariosEl =
    document.getElementById(
      "configTotalFuncionarios"
    );

  const totalFacialEl =
    document.getElementById(
      "configTotalFacial"
    );


  try {

    const respostaEmpresa =
      await fetchAutenticado(
        `${API_URL}/empresa/me`
      );


    if (
      !respostaEmpresa.ok
    ) {

      throw new Error(
        "Não foi possível carregar a empresa."
      );

    }


    const empresa =
      await respostaEmpresa.json();


    localStorage.setItem(
      "empresa",
      JSON.stringify(
        empresa
      )
    );


    if (nomeEl) {

      nomeEl.textContent =
        empresa.nome ||
        "Empresa";

    }


    if (cnpjEl) {

      cnpjEl.textContent =
        empresa.cnpj

          ? `CNPJ: ${empresa.cnpj}`

          : "CNPJ não informado";

    }


    let logoFinal =
      "assets/img/dash.png";

    const logoInformada =
      empresa.logoUrl ||
      (
        empresa.temLogo &&
        empresa.id
          ? `/empresa/logo/${empresa.id}`
          : ""
      );


    if (
      logoInformada
    ) {

      const logoUrl =
        String(
          logoInformada
        );


      if (
        logoUrl.startsWith(
          "http://"
        ) ||
        logoUrl.startsWith(
          "https://"
        )
      ) {

        logoFinal =
          logoUrl;

      } else {

        logoFinal =
          `${API_URL}${logoUrl}`;

      }

    }


    if (logoConfigEl) {
      logoConfigEl.onerror = () => {
        logoConfigEl.onerror = null;
        logoConfigEl.src =
          "assets/img/dash.png";
      };
      logoConfigEl.onload = () =>
        prepararLogoParaTema(
          logoConfigEl
        );
      logoConfigEl.src =
        logoFinal;

    }


    const respostaUsuarios =
      await fetchAutenticado(
        `${API_URL}/empresa/usuarios`
      );


    if (
      !respostaUsuarios.ok
    ) {

      throw new Error(
        "Não foi possível carregar os funcionários."
      );

    }


    const usuarios =
      await respostaUsuarios.json();


    const listaUsuarios =
      Array.isArray(
        usuarios
      )

        ? usuarios

        : [];


    if (
      totalFuncionariosEl
    ) {

      totalFuncionariosEl.textContent =
        listaUsuarios.length;

    }


    if (totalFacialEl) {

      const comFacial =
        listaUsuarios.filter(
          usuario => {

            const quantidade =
              Number(
                usuario.quantidadeFaces ||
                0
              );


            return (
              usuario.facialCadastrada ===
              true ||
              quantidade > 0
            );

          }
        ).length;


      totalFacialEl.textContent =
        comFacial;

    }


  } catch (erro) {

    console.warn(
      "Erro ao carregar resumo da empresa:",
      erro
    );


    if (nomeEl) {

      nomeEl.textContent =
        "Empresa";

    }


    if (cnpjEl) {

      cnpjEl.textContent =
        "Não foi possível carregar";

    }


    if (
      totalFuncionariosEl
    ) {

      totalFuncionariosEl.textContent =
        "-";

    }


    if (totalFacialEl) {

      totalFacialEl.textContent =
        "-";

    }

  }

}


// ======================================================
// VISÃO GERAL DA OPERAÇÃO
// ======================================================

async function carregarVisaoGeralOperacao() {

  try {

    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas`
      );


    if (
      !resposta.ok
    ) {

      throw new Error(
        "Não foi possível carregar as máquinas."
      );

    }


    const dados =
      await resposta.json();


    const maquinas =
      Array.isArray(
        dados
      )

        ? dados

        : [];


    // ==================================================
    // TOTAL
    // ==================================================

    const total =
      maquinas.length;


    // ==================================================
    // STATUS
    // ==================================================

    const emOperacao =
      maquinas.filter(
        maquina => {

          const status =
            String(
              maquina.status ||
              ""
            )
              .toLowerCase();


          return (
            status ===
            "ligada" ||
            status.includes(
              "ligada"
            )
          );

        }
      ).length;


    const emAlerta =
      maquinas.filter(
        maquina => {

          const status =
            String(
              maquina.status ||
              ""
            )
              .toLowerCase();


          return status.includes(
            "alerta"
          );

        }
      ).length;


    const emManutencao =
      maquinas.filter(
        maquina => {

          const status =
            String(
              maquina.status ||
              ""
            )
              .toLowerCase();


          return status.includes(
            "manuten"
          );

        }
      ).length;


    // ==================================================
    // PRODUÇÃO
    // ==================================================

    const producaoTotal =
      maquinas.reduce(
        (
          acumulado,
          maquina
        ) => {

          return (
            acumulado +
            Number(
              maquina.producao ||
              0
            )
          );

        },
        0
      );


    // ==================================================
    // CICLOS
    // ==================================================

    const ciclosTotal =
      maquinas.reduce(
        (
          acumulado,
          maquina
        ) => {

          return (
            acumulado +
            Number(
              maquina.ciclos ||
              0
            )
          );

        },
        0
      );


    // ==================================================
    // ENERGIA
    // ==================================================

    const energiaTotal =
      maquinas.reduce(
        (
          acumulado,
          maquina
        ) => {

          return (
            acumulado +
            Number(
              maquina.consumoEnergia ||
              0
            )
          );

        },
        0
      );


    const energiaMedia =
      total > 0

        ? Math.round(
            energiaTotal /
            total
          )

        : 0;


    // ==================================================
    // TEMPERATURA
    // ==================================================

    const temperaturaTotal =
      maquinas.reduce(
        (
          acumulado,
          maquina
        ) => {

          return (
            acumulado +
            Number(
              maquina.temperatura ||
              0
            )
          );

        },
        0
      );


    const temperaturaMedia =
      total > 0

        ? Math.round(
            temperaturaTotal /
            total
          )

        : 0;


    // ==================================================
    // SAÚDE DA OPERAÇÃO
    // ==================================================

    let pontosSaude =
      0;


    maquinas.forEach(
      maquina => {

        const status =
          String(
            maquina.status ||
            ""
          )
            .toLowerCase();


        if (
          status.includes(
            "ligada"
          )
        ) {

          pontosSaude +=
            100;

          return;

        }


        if (
          status.includes(
            "alerta"
          )
        ) {

          pontosSaude +=
            50;

          return;

        }


        if (
          status.includes(
            "manuten"
          )
        ) {

          pontosSaude +=
            20;

          return;

        }


        pontosSaude +=
          40;

      }
    );


    const saude =
      total > 0

        ? Math.round(
            pontosSaude /
            total
          )

        : 100;


    // ==================================================
    // ATUALIZA NÚMEROS
    // ==================================================

    if (
      totalMaquinasEmpresaEl
    ) {

      totalMaquinasEmpresaEl.textContent =
        total;

    }


    if (
      totalMaquinasOperacaoEl
    ) {

      totalMaquinasOperacaoEl.textContent =
        emOperacao;

    }


    if (
      totalMaquinasAlertaEl
    ) {

      totalMaquinasAlertaEl.textContent =
        emAlerta;

    }


    if (
      totalMaquinasManutencaoEl
    ) {

      totalMaquinasManutencaoEl.textContent =
        emManutencao;

    }


    if (
      producaoTotalEmpresaEl
    ) {

      producaoTotalEmpresaEl.textContent =
        producaoTotal
          .toLocaleString(
            "pt-BR"
          );

    }


    if (
      ciclosTotalEmpresaEl
    ) {

      ciclosTotalEmpresaEl.textContent =
        ciclosTotal
          .toLocaleString(
            "pt-BR"
          );

    }


    if (
      energiaMediaEmpresaEl
    ) {

      energiaMediaEmpresaEl.textContent =
        `${energiaMedia}%`;

    }


    if (
      temperaturaMediaEmpresaEl
    ) {

      temperaturaMediaEmpresaEl.textContent =
        `${temperaturaMedia} °C`;

    }


    if (
      saudeOperacaoValorEl
    ) {

      saudeOperacaoValorEl.textContent =
        `${saude}%`;

    }


    // ==================================================
    // BARRA DE SAÚDE
    // ==================================================

    if (
      saudeOperacaoBarraEl
    ) {

      saudeOperacaoBarraEl.style.width =
        `${saude}%`;


      saudeOperacaoBarraEl
        .classList
        .remove(
          "health-good",
          "health-warning",
          "health-critical"
        );


      if (
        saude >= 80
      ) {

        saudeOperacaoBarraEl
          .classList
          .add(
            "health-good"
          );

      } else if (
        saude >= 55
      ) {

        saudeOperacaoBarraEl
          .classList
          .add(
            "health-warning"
          );

      } else {

        saudeOperacaoBarraEl
          .classList
          .add(
            "health-critical"
          );

      }

    }


    // ==================================================
    // TEXTO DE SAÚDE
    // ==================================================

    if (
      saudeOperacaoTextoEl
    ) {

      if (
        total === 0
      ) {

        saudeOperacaoTextoEl.textContent =
          "Nenhum equipamento cadastrado.";

      } else if (
        saude >= 90
      ) {

        saudeOperacaoTextoEl.textContent =
          "Operação excelente. Equipamentos funcionando normalmente.";

      } else if (
        saude >= 80
      ) {

        saudeOperacaoTextoEl.textContent =
          "Operação estável. Continue acompanhando os equipamentos.";

      } else if (
        saude >= 55
      ) {

        saudeOperacaoTextoEl.textContent =
          "Atenção recomendada. Existem equipamentos que precisam ser verificados.";

      } else {

        saudeOperacaoTextoEl.textContent =
          "Situação crítica. A operação precisa de atenção imediata.";

      }

    }


    // ==================================================
    // BADGE
    // ==================================================

    if (
      operationUpdateBadgeEl
    ) {

      operationUpdateBadgeEl
        .classList
        .remove(
          "error"
        );


      operationUpdateBadgeEl.innerHTML = `
        <span></span>
        Dados atualizados
      `;

    }


  } catch (erro) {

    console.error(
      "Erro na visão geral:",
      erro
    );


    if (
      operationUpdateBadgeEl
    ) {

      operationUpdateBadgeEl
        .classList
        .add(
          "error"
        );


      operationUpdateBadgeEl.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Indisponível
      `;

    }

  }

}


// ======================================================
// TROCAR TELAS
// ======================================================

function registrarDestinoPainelAtual() {
  const painel =
    new URLSearchParams(
      window.location.search
    ).get("view");

  if (
    painel !== "controller" &&
    painel !== "dobot"
  ) {
    return;
  }

  const destino =
    `/app/dashboard?view=${painel}`;

  localStorage.setItem(
    "dashboardMaquinaDestino",
    destino
  );

  localStorage.setItem(
    "empresaRetornoDashboard",
    destino
  );
}

registrarDestinoPainelAtual();

function mostrarTela(
  nomeTela,
  botao
) {

  const painelSolicitado = new URLSearchParams(window.location.search).get("view");
  if (nomeTela === "inicio" && painelSolicitado === "dobot") nomeTela = "dobot";
  if (nomeTela === "inicio" && painelSolicitado === "controller") nomeTela = "controller";

  const telas =
    document.querySelectorAll(
      ".tela"
    );


  const botoes =
    document.querySelectorAll(
      ".menu-btn"
    );


  telas.forEach(
    tela => {

      tela.classList.remove(
        "ativa"
      );

    }
  );


  botoes.forEach(
    btn => {

      btn.classList.remove(
        "active"
      );

    }
  );


  const mapaTelas = {

    inicio:
      "inicio",

    maquinas:
      "maquinas",

    producao:
      "producaoTela",

    manutencao:
      "manutencaoTela",

    logs:
      "logsTela",

    alertas:
      "alertasTela",

    auditoria:
      "auditoriaTela",

    controller:
      "controllerTela",

    dobot:
      "dobotTela",

    configuracoes:
      "configuracoesTela"

  };


  const idTela =
    mapaTelas[
      nomeTela
    ];


  if (idTela) {

    const tela =
      document.getElementById(
        idTela
      );


    tela
      ?.classList
      .add(
        "ativa"
      );

  }


  if (
    nomeTela ===
    "manutencao"
  ) {

    carregarManutencoes();

  }


  if (
    nomeTela ===
    "auditoria"
  ) {
    carregarAuditoria();
  }


  if (
    nomeTela ===
    "configuracoes"
  ) {

    if (idiomaConfig) {

      idiomaConfig.value =
        localStorage.getItem(
          "idiomaSistema"
        ) || "pt";

    }


    if (temaConfig) {

      temaConfig.value =
        localStorage.getItem(
          "temaSistema"
        ) || "claro";

    }


    carregarResumoEmpresa();

  }


  if (botao) {

    botao.classList.add(
      "active"
    );

  }

  if (!botao && (nomeTela === "controller" || nomeTela === "dobot")) {
    document.getElementById("homeMenuButton")?.classList.add("active");
  }

}


// ======================================================
// MOSTRAR TELA INICIAL
// ======================================================

function mostrarTelaPorNome() {
  mostrarTela("inicio", document.getElementById("homeMenuButton"));
}


// ======================================================
// VOLTAR PARA MÁQUINAS
// ======================================================

function voltarMaquinas() {

  window.location.href =
    "/app/maquinas";

}


// ======================================================
// MINHA EMPRESA
// ======================================================

function abrirMinhaEmpresa() {

  const painelAtual =
    new URLSearchParams(
      window.location.search
    ).get("view");

  const destinoAtual =
    painelAtual === "dobot"
      ? "/app/dashboard?view=dobot"
      : painelAtual === "controller"
        ? "/app/dashboard?view=controller"
        : localStorage.getItem(
            "dashboardMaquinaDestino"
          );

  localStorage.setItem(
    "empresaOrigem",
    "dashboard"
  );

  if (
    destinoAtual ===
      "/app/dashboard?view=dobot" ||
    destinoAtual ===
      "/app/dashboard?view=controller"
  ) {
    localStorage.setItem(
      "empresaRetornoDashboard",
      destinoAtual
    );
  } else {
    localStorage.removeItem(
      "empresaRetornoDashboard"
    );
  }

  window.location.href =
    "/app/empresa";

}


// ======================================================
// COMPATIBILIDADE
// ======================================================

function abrirMinhaConta() {

  abrirMinhaEmpresa();

}


// ======================================================
// SAIR
// ======================================================

function sairSistema() {

  limparSessao();


  window.location.href =
    "/app/login";

}


// ======================================================
// ATUALIZAR IDIOMA
// ======================================================

function atualizarIdiomaDashboard() {

  if (
    typeof aplicarIdioma ===
    "function"
  ) {

    aplicarIdioma();

  }


  if (idiomaConfig) {

    idiomaConfig.value =
      localStorage.getItem(
        "idiomaSistema"
      ) || "pt";

  }


  if (temaConfig) {

    temaConfig.value =
      localStorage.getItem(
        "temaSistema"
      ) || "claro";

  }


  if (
    graficoProducao &&
    typeof pegarTexto ===
    "function"
  ) {

    graficoProducao
      .data
      .datasets[0]
      .label =
        pegarTexto(
          "producaoCard"
        );


    graficoProducao
      .update();

  }


  if (
    graficoProducao2 &&
    typeof pegarTexto ===
    "function"
  ) {

    graficoProducao2
      .data
      .datasets[0]
      .label =
        pegarTexto(
          "graficoProducao"
        );


    graficoProducao2
      .update();

  }


  if (
    graficoTemperatura &&
    typeof pegarTexto ===
    "function"
  ) {

    graficoTemperatura
      .data
      .datasets[0]
      .label =
        pegarTexto(
          "temperaturaMaquina"
        );


    graficoTemperatura
      .update();

  }


  if (
    graficoEnergia &&
    typeof pegarTexto ===
    "function"
  ) {

    graficoEnergia
      .data
      .datasets[0]
      .label =
        pegarTexto(
          "consumoEnergia"
        );


    graficoEnergia
      .update();

  }


  if (
    maquinaAtual
  ) {

    atualizarTela(
      maquinaAtual
    );

  }

}


// ======================================================
// EVENTOS
// ======================================================

window.addEventListener(
  "idiomaAlterado",
  atualizarIdiomaDashboard
);


window.addEventListener(
  "configAtualizada",
  atualizarIdiomaDashboard
);


// ======================================================
// QUANDO VOLTAR DA EMPRESA
// ======================================================

window.addEventListener(
  "focus",
  () => {

    carregarResumoEmpresa();

    carregarVisaoGeralOperacao();

  }
);


// ======================================================
// INICIALIZAÇÃO
// ======================================================

// ======================================================
// ATUALIZAÇÃO REAL-TIME COM SNAPSHOT COMPACTO
// ======================================================

window.aplicarTelemetriaTempoReal = function aplicarTelemetriaTempoReal(snapshot) {
  if (!snapshot) return;

  maquinaAtual = {
    ...(maquinaAtual || {}),
    ...snapshot,
    logs: maquinaAtual?.logs || [],
    alertas: maquinaAtual?.alertas || [],
    manutencoes: maquinaAtual?.manutencoes || [],
    telemetria: maquinaAtual?.telemetria || []
  };

  atualizarTela(maquinaAtual);
  atualizarGrafico(maquinaAtual);
};

window.recarregarDashboardCompleto = buscarDados;

configurarSelects();


atualizarIdiomaDashboard();


// Respeita imediatamente ?view=controller ou ?view=dobot.
// Sem esta chamada, o HTML mantinha o painel geral antigo
// como ativo ate o usuario clicar manualmente em Inicio.
mostrarTelaPorNome();


// Máquina selecionada
buscarDados();


// Visão geral da fábrica
carregarVisaoGeralOperacao();


// Empresa
carregarResumoEmpresa();


// Manutenções
carregarManutencoes();


// ======================================================
// ATUALIZAÇÃO EM TEMPO REAL
// ======================================================

// Máquina selecionada
// Atualização contínua é controlada por industrial-runtime.js (SSE + fallback).


// Visão geral da fábrica
setInterval(
  carregarVisaoGeralOperacao,
  10000
);

window.addEventListener(
  "idiomaAlterado",
  async () => {
    try {
      await carregarManutencoes();
      await carregarVisaoGeralOperacao();

      if (maquinaAtual) {
        atualizarTela(maquinaAtual);
      }
    } catch (_) {}
  }
);


document.addEventListener(
  "DOMContentLoaded",
  () => {
    [
      document.getElementById("empresaLogoSidebar"),
      document.getElementById("configEmpresaLogo")
    ]
      .filter(Boolean)
      .forEach(prepararLogoParaTema);
  }
);


window.addEventListener(
  "configAtualizada",
  () => {
    if (typeof aplicarIdioma === "function") {
      aplicarIdioma();
    }
  }
);


// ======================================================
// AUDITORIA DO SISTEMA
// ======================================================

let auditoriaItens = [];

const auditTimeline =
  document.getElementById(
    "auditTimeline"
  );

const auditState =
  document.getElementById(
    "auditState"
  );

const auditSearch =
  document.getElementById(
    "auditSearch"
  );

const auditActionFilter =
  document.getElementById(
    "auditActionFilter"
  );


function formatarDataAuditoria(valor) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "--";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}


function iconeAuditoria(acao) {
  const mapa = {
    CRIAR: "fa-plus",
    ATUALIZAR: "fa-pen",
    DESATIVAR: "fa-ban",
    EXCLUIR: "fa-trash",
    LOGIN: "fa-right-to-bracket"
  };

  return mapa[
    String(acao || "")
      .toUpperCase()
  ] || "fa-shield";
}


function renderizarAuditoria() {
  if (!auditTimeline || !auditState) {
    return;
  }

  const termo =
    String(auditSearch?.value || "")
      .trim()
      .toLowerCase();

  const filtro =
    String(auditActionFilter?.value || "")
      .trim()
      .toUpperCase();

  const filtrados =
    auditoriaItens.filter(
      item => {
        const acao =
          String(item.acao || "")
            .toUpperCase();

        const texto =
          [
            item.acao,
            item.entidade,
            item.usuario?.nome,
            item.usuario?.email,
            item.entidadeId
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return (
          (!filtro || acao === filtro) &&
          (!termo || texto.includes(termo))
        );
      }
    );

  auditTimeline.innerHTML = "";

  if (!filtrados.length) {
    auditState.hidden = false;
    auditState.innerHTML = `
      <i class="fa-regular fa-folder-open"></i>
      Nenhum evento encontrado.
    `;
    return;
  }

  auditState.hidden = true;

  filtrados.forEach(
    item => {
      const linha =
        document.createElement(
          "article"
        );

      const acao =
        String(item.acao || "EVENTO")
          .toUpperCase();

      const detalhes =
        item.detalhes
          ? escaparHtml(
              JSON.stringify(
                item.detalhes
              )
            )
          : "Sem detalhes adicionais";

      linha.className =
        `audit-item action-${acao.toLowerCase()}`;

      linha.innerHTML = `
        <div class="audit-item-icon">
          <i class="fa-solid ${iconeAuditoria(acao)}"></i>
        </div>

        <div class="audit-item-content">
          <div class="audit-item-heading">
            <strong>
              ${escaparHtml(acao)}
              ·
              ${escaparHtml(item.entidade || "SISTEMA")}
            </strong>

            <time>
              ${formatarDataAuditoria(item.criadoEm)}
            </time>
          </div>

          <p>
            <b>${escaparHtml(item.usuario?.nome || "Sistema")}</b>
            ${item.entidadeId
              ? `afetou o registro #${escaparHtml(item.entidadeId)}`
              : "executou uma ação no sistema"}.
          </p>

          <details>
            <summary>Detalhes técnicos</summary>
            <code>${detalhes}</code>
          </details>
        </div>
      `;

      auditTimeline.appendChild(
        linha
      );
    }
  );
}


async function carregarAuditoria() {
  if (!auditTimeline || !auditState) {
    return;
  }

  if (
    String(cargoUsuario || "")
      .toUpperCase() !==
    "ADMINISTRADOR"
  ) {
    auditState.hidden = false;
    auditState.innerHTML = `
      <i class="fa-solid fa-lock"></i>
      Auditoria disponível somente para administradores.
    `;
    return;
  }

  auditState.hidden = false;
  auditState.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Carregando auditoria...
  `;

  try {
    const resposta =
      await fetchAutenticado(
        `${API_URL}/auditoria?limit=150`
      );

    const dados =
      await resposta
        .json()
        .catch(() => []);

    if (!resposta.ok) {
      throw new Error(
        dados?.mensagem ||
        "Não foi possível carregar a auditoria."
      );
    }

    auditoriaItens =
      Array.isArray(dados)
        ? dados
        : [];

    document.getElementById(
      "auditTotal"
    ).textContent =
      auditoriaItens.length;

    document.getElementById(
      "auditUsuarios"
    ).textContent =
      new Set(
        auditoriaItens
          .map(
            item =>
              item.usuario?.id
          )
          .filter(Boolean)
      ).size;

    document.getElementById(
      "auditUltimaAtividade"
    ).textContent =
      auditoriaItens[0]
        ? formatarDataAuditoria(
            auditoriaItens[0].criadoEm
          )
        : "--";

    renderizarAuditoria();

  } catch (erro) {
    auditState.hidden = false;
    auditState.innerHTML = `
      <i class="fa-solid fa-circle-exclamation"></i>
      ${escaparHtml(erro.message)}
    `;
  }
}


auditSearch?.addEventListener(
  "input",
  renderizarAuditoria
);

auditActionFilter?.addEventListener(
  "change",
  renderizarAuditoria
);

document
  .getElementById(
    "btnAtualizarAuditoria"
  )
  ?.addEventListener(
    "click",
    carregarAuditoria
  );

const auditMenuButton =
  document.getElementById(
    "auditMenuButton"
  );

if (
  auditMenuButton &&
  String(cargoUsuario || "")
    .toUpperCase() !==
    "ADMINISTRADOR"
) {
  auditMenuButton.hidden = true;
}
