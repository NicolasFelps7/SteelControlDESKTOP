// =========================================================
// STEELCONTROL
// EQUIPAMENTOS INDUSTRIAIS
// =========================================================


// =========================================================
// CONFIGURAÇÃO
// =========================================================

const API_URL =
  window.STEELCONTROL_API_URL;

const TOKEN_API =
  localStorage.getItem(
    "token"
  );



function textoMaquinas(
  chave,
  fallback
) {
  try {
    if (
      typeof pegarTexto === "function"
    ) {
      const valor =
        pegarTexto(chave);

      if (
        valor &&
        valor !== chave
      ) {
        return valor;
      }
    }
  } catch (_) {}

  return fallback;
}


// =========================================================
// ESTADO
// =========================================================

let maquinas = [];
let maquinaEditandoId = null;
let dispositivosDescobertos = [];
let discoveryRefreshTimer = null;
let discoveryDiagnostics = null;


// =========================================================
// SESSÃO
// =========================================================

const autenticado =
  localStorage.getItem(
    "autenticado"
  );

const usuarioLogado =
  localStorage.getItem(
    "usuarioLogado"
  );

const cargoUsuario =
  localStorage.getItem(
    "cargoUsuario"
  );

function usuarioEhAdministrador() {
  return String(
    cargoUsuario || ""
  )
    .trim()
    .toUpperCase() ===
    "ADMINISTRADOR";
}


if (
  autenticado !== "true" ||
  !TOKEN_API
) {

  window.location.href =
    "/app/login";

}


// =========================================================
// TEMA
// =========================================================

function aplicarTemaSalvo() {

  const tema =
    localStorage.getItem(
      "temaSistema"
    ) || "claro";


  document.documentElement
    .setAttribute(
      "data-theme",
      tema
    );

}


aplicarTemaSalvo();


window.addEventListener(
  "pageshow",
  aplicarTemaSalvo
);


// =========================================================
// ELEMENTOS
// =========================================================

const maquinasGrid =
  document.getElementById(
    "maquinasGrid"
  );

const formMaquina =
  document.getElementById(
    "formMaquina"
  );

const mensagemMaquina =
  document.getElementById(
    "mensagemMaquina"
  );

const buscaMaquina =
  document.getElementById(
    "buscaMaquina"
  );

const filtroTipo =
  document.getElementById(
    "filtroTipo"
  );

const filtroStatus =
  document.getElementById(
    "filtroStatus"
  );


// =========================================================
// USUÁRIO
// =========================================================

const usuarioElemento =
  document.getElementById(
    "usuarioLogado"
  );

const cargoElemento =
  document.getElementById(
    "cargoUsuario"
  );


if (
  usuarioElemento
) {

  usuarioElemento.textContent =
    usuarioLogado ||
    "Usuário";

}


if (
  cargoElemento
) {

  cargoElemento.textContent =
    cargoUsuario ||
    "Usuário";

}


// =========================================================
// API AUTENTICADA
// =========================================================

async function fetchAutenticado(
  url,
  options = {}
) {

  const headers =
    new Headers(
      options.headers ||
      {}
    );


  if (
    TOKEN_API
  ) {

    headers.set(
      "Authorization",
      `Bearer ${TOKEN_API}`
    );

  }


  if (
    options.body &&
    !headers.has(
      "Content-Type"
    )
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );

  }


  headers.set("Cache-Control", "no-cache");

  const resposta =
    await fetch(
      url,
      {
        ...options,
        headers,
        cache: "no-store"
      }
    );


  if (
    resposta.status === 401
  ) {

    sair(false);


    throw new Error(
      "Sessão expirada."
    );

  }


  return resposta;

}


// =========================================================
// ESCAPAR HTML
// =========================================================

function escaparHtml(
  valor
) {

  return String(
    valor ??
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}



// =========================================================
// INTEGRAÇÃO / CHAVE DO EQUIPAMENTO
// =========================================================

function formatarControladorLista(controlador) {
  const mapa = {
    ESP32: "ESP32",
    DOBOT_MAGICIAN: "Dobot Magician",
    CLP_PLC: "CLP / PLC",
    CONTROLADOR_ROBOTICO: "Controlador robótico",
    CNC: "CNC",
    GATEWAY_INDUSTRIAL: "Gateway industrial",
    OUTRO: "Outro"
  };

  return mapa[controlador] || controlador || "Não definido";
}


function formatarProtocoloLista(protocolo) {
  const mapa = {
    HTTP_REST: "HTTP / REST",
    USB_SERIAL: "USB / Serial",
    SERIAL_JSON: "Serial genérica / JSON",
    MQTT: "MQTT",
    MODBUS_TCP: "Modbus TCP",
    MODBUS_RTU: "Modbus RTU",
    OPC_UA: "OPC UA",
    TCP_IP: "TCP/IP",
    OUTRO: "Outro"
  };

  return mapa[protocolo] || protocolo || "Não definido";
}

function traduzirLiteralMaquinas(texto) {
  return typeof traduzirTextoLivre === "function"
    ? traduzirTextoLivre(texto)
    : texto;
}

function statusConexaoLista(maquina) {
  const codigo = String(
    maquina?.estadoConexao?.codigo || ""
  ).toUpperCase();

  if (codigo === "CONECTADA") {
    return { texto: traduzirLiteralMaquinas("Conectada"), classe: "connected" };
  }

  if (codigo === "INSTAVEL") {
    return { texto: traduzirLiteralMaquinas("Instável"), classe: "unstable" };
  }

  if (codigo === "SIMULACAO") {
    return { texto: traduzirLiteralMaquinas("Simulação"), classe: "simulation" };
  }

  return { texto: traduzirLiteralMaquinas("Offline"), classe: "offline" };
}

function statusAtualMaquina(maquina) {
  const codigoConexao =
    String(
      maquina?.estadoConexao?.codigo ||
      ""
    )
      .trim()
      .toUpperCase();

  if (maquina?.modoSimulacao === false && codigoConexao === "OFFLINE") {
    return {
      valor: "Offline",
      texto: traduzirLiteralMaquinas("Offline"),
      classe: "offline-status"
    };
  }

  if (maquina?.modoSimulacao === false && codigoConexao === "INSTAVEL") {
    return {
      valor: "Instável",
      texto: traduzirLiteralMaquinas("Conexão instável"),
      classe: "unstable-status"
    };
  }

  const valor =
    maquina?.status ||
    "Sem status";

  return {
    valor,
    texto: traduzirStatus(valor),
    classe: classeStatus(valor)
  };
}

async function copiarTextoSeguro(valor) {
  try {
    await navigator.clipboard.writeText(valor);
    return true;
  } catch (_) {
    const area = document.createElement("textarea");
    area.value = valor;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function mostrarDeviceKey(chave, titulo = "Chave do equipamento", maquinaId = null) {
  if (!chave) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "device-key-overlay";
  overlay.innerHTML = `
    <div class="device-key-modal" role="dialog" aria-modal="true">
      <div class="device-key-modal-icon">
        <i class="fa-solid fa-key"></i>
      </div>

      <h3>${escaparHtml(titulo)}</h3>

      <p>
        Guarde esta chave para configurar o ESP32, CLP ou gateway.
        O SteelControl salva somente o hash da credencial.
      </p>

      ${maquinaId ? `<div class="device-key-machine-id">ID da máquina: <strong>${escaparHtml(maquinaId)}</strong></div>` : ""}
      <code class="device-key-code">${escaparHtml(chave)}</code>

      <div class="device-key-actions">
        <button type="button" class="device-key-edge-copy" ${maquinaId ? "" : "disabled"}>
          <i class="fa-solid fa-plug-circle-check"></i>
          Copiar para SteelControl Edge
        </button>

        <button type="button" class="device-key-copy">
          <i class="fa-regular fa-copy"></i>
          Copiar só a chave
        </button>

        <button type="button" class="device-key-close">
          Entendi
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay
    .querySelector(".device-key-edge-copy")
    ?.addEventListener("click", async () => {
      if (!maquinaId) return;
      const pacote = JSON.stringify({
        steelControlEdge: 1,
        server: String(API_URL || window.STEELCONTROL_API_URL || window.location.origin).replace(/\/$/, ""),
        machineId: Number(maquinaId),
        deviceKey: chave
      });
      const ok = await copiarTextoSeguro(pacote);
      window.SteelUI?.toast?.({
        tipo: ok ? "success" : "error",
        titulo: ok ? "Pacote do Edge copiado" : "Não foi possível copiar",
        mensagem: ok
          ? "Abra o SteelControl Edge e clique em Importar do clipboard."
          : "Copie a Device Key e o ID da máquina manualmente."
      });
    });

  overlay
    .querySelector(".device-key-copy")
    ?.addEventListener("click", async () => {
      const ok = await copiarTextoSeguro(chave);

      if (window.SteelUI?.toast) {
        window.SteelUI.toast({
          tipo: ok ? "success" : "error",
          titulo: ok ? "Chave copiada" : "Não foi possível copiar",
          mensagem: ok
            ? "Cole a chave na configuração do equipamento."
            : "Selecione a chave manualmente."
        });
      }
    });

  const fechar = () => overlay.remove();

  overlay
    .querySelector(".device-key-close")
    ?.addEventListener("click", fechar);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      fechar();
    }
  });
}

async function renovarChaveMaquina(maquina) {
  const confirmar = window.SteelUI?.confirm
    ? await window.SteelUI.confirm({
        titulo: "Gerar nova chave de acesso",
        mensagem:
          `Deseja gerar uma nova chave para "${maquina.nome}"?\n\n` +
          "A chave atual será invalidada imediatamente. O controlador do equipamento precisará usar a nova credencial para continuar enviando telemetria.",
        confirmar: "Gerar nova chave",
        cancelar: "Cancelar",
        perigoso: true
      })
    : window.confirm(`Deseja gerar uma nova chave para "${maquina.nome}"?`);

  if (!confirmar) return;

  try {
    const resposta = await fetchAutenticado(
      `${API_URL}/maquinas/${maquina.id}/device-key/regenerar`,
      { method: "POST" }
    );
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Não foi possível gerar a nova chave.");
    }

    mostrarDeviceKey(dados.deviceKey, `Nova chave — ${maquina.nome}`, maquina.id);
    window.SteelUI?.toast?.({
      tipo: "success",
      titulo: "Nova chave gerada",
      mensagem: "A chave anterior foi invalidada. Copie a nova Device Key para o controlador do equipamento."
    });
    await carregarMaquinas();
  } catch (erro) {
    console.error("Erro ao renovar Device Key:", erro);
    if (window.SteelUI?.toast) {
      window.SteelUI.toast({
        tipo: "error",
        titulo: "Não foi possível gerar a chave",
        mensagem: erro.message || "Ocorreu um erro ao gerar a nova credencial."
      });
    } else {
      alert(erro.message || "Erro ao renovar a chave.");
    }
  }
}

// =========================================================
// ABRIR FORMULÁRIO
// =========================================================

function abrirFormularioMaquina() {

  if (
    !formMaquina
  ) {

    return;

  }


  formMaquina.classList.toggle(
    "ativo"
  );


  if (
    formMaquina.classList.contains(
      "ativo"
    )
  ) {

    setTimeout(
      () => {

        document
          .getElementById(
            "nomeMaquinaInput"
          )
          ?.focus();

      },
      100
    );

  }

}


// =========================================================
// FECHAR FORMULÁRIO
// =========================================================

function fecharFormularioMaquina() {

  formMaquina?.classList.remove(
    "ativo"
  );

  maquinaEditandoId =
    null;

  formMaquina?.reset();

  formMaquina
    ?.querySelectorAll(
      ".form-disclosure"
    )
    .forEach(
      detalhes => detalhes.open = false
    );

  atualizarAjudaModoOperacao();
  atualizarPainelDobot();
  atualizarPerfilControlador();

  const botaoSalvar =
    formMaquina?.querySelector(
      ".save-machine-btn"
    );

  if (botaoSalvar) {
    botaoSalvar.innerHTML = `
      <i class="fa-solid fa-floppy-disk"></i>
      Cadastrar equipamento
    `;
  }

  if (mensagemMaquina) {
    mensagemMaquina.textContent =
      "";
  }

}


// =========================================================
// MODO DE OPERAÇÃO
// =========================================================

function atualizarAjudaModoOperacao() {
  const campo =
    document.getElementById(
      "modoOperacaoInput"
    );

  const ajuda =
    document.getElementById(
      "modoOperacaoHelp"
    );

  if (!campo || !ajuda) {
    return;
  }

  if (campo.value === "real") {
    ajuda.textContent =
      "Modo real: o simulador fica desativado. Configure o controlador e o protocolo de comunicação. A máquina permanecerá offline até receber telemetria real.";
    ajuda.classList.add(
      "real-selected"
    );
    return;
  }

  ajuda.textContent =
    "Use simulação enquanto não houver um equipamento físico conectado.";
  ajuda.classList.remove(
    "real-selected"
  );
}


function atualizarPainelDobot() {
  const controlador = document.getElementById("controladorInput")?.value;
  const painel = document.getElementById("dobotConfigPanel");
  if (!painel) return;
  const ativo = controlador === "DOBOT_MAGICIAN";
  painel.hidden = !ativo;
  if (ativo) {
    const protocolo = document.getElementById("protocoloInput");
    const modo = document.getElementById("modoOperacaoInput");
    if (protocolo && !protocolo.value) protocolo.value = "USB_SERIAL";
    if (modo) modo.value = "real";
    atualizarAjudaModoOperacao();
  }
}

document.getElementById("controladorInput")?.addEventListener("change", atualizarPainelDobot);
atualizarPainelDobot();

// =========================================================
// BRAÇO ROBÓTICO
// =========================================================

function preencherBracoRobotico() {

  const nome =
    document.getElementById(
      "nomeMaquinaInput"
    );

  const setor =
    document.getElementById(
      "setorMaquinaInput"
    );

  const modelo =
    document.getElementById(
      "modeloMaquinaInput"
    );

  const fabricante =
    document.getElementById(
      "fabricanteInput"
    );

  const codigo =
    document.getElementById(
      "codigoInput"
    );

  const tipo =
    document.getElementById(
      "tipoInput"
    );

  const descricao =
    document.getElementById(
      "descricaoInput"
    );


  if (nome) {

    nome.value =
      "Braço robótico";

  }


  if (setor) {

    setor.value =
      "Automação";

  }


  if (modelo) {

    modelo.value =
      "ROB-01";

  }


  if (fabricante) {

    fabricante.value =
      "A definir";

  }


  if (codigo) {

    codigo.value =
      "BR-001";

  }


  if (tipo) {

    tipo.value =
      "Braço robótico";

  }


  if (descricao) {

    descricao.value =
      "Braço robótico utilizado para testes, movimentação e automação de processos industriais.";

  }

  const detalhesIdentificacao =
    document.getElementById(
      "identificationDetails"
    );

  if (detalhesIdentificacao) {
    detalhesIdentificacao.open = true;
  }

  const modoOperacao =
    document.getElementById(
      "modoOperacaoInput"
    );

  if (modoOperacao) {
    modoOperacao.value =
      "simulacao";
    atualizarAjudaModoOperacao();
  }


  mensagemMaquina.textContent =
    "Modelo de braço robótico preenchido. Altere os dados conforme seu equipamento.";


  mensagemMaquina.className =
    "mensagem-maquina sucesso";

}


// =========================================================
// DESCOBERTA AUTOMÁTICA DE EQUIPAMENTOS
// =========================================================

function discoveryMessage(texto, tipo = "") {
  const elemento = document.getElementById("discoveryMessage");
  if (!elemento) return;
  elemento.textContent = texto || "";
  elemento.className = `discovery-message ${tipo}`.trim();
}

function formatarTempoDescoberta(value) {
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "agora";
  const segundos = Math.max(0, Math.round((Date.now() - data.getTime()) / 1000));
  return segundos < 5 ? "agora" : `${segundos}s atrás`;
}

function formatarHorarioDiagnostico(value) {
  if (!value) return "Ainda não recebido";
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function renderDiagnosticoDescoberta(diagnostico) {
  const content = document.getElementById("discoveryDiagnosticsContent");
  const details = document.getElementById("discoveryDiagnostics");
  if (!content) return;

  discoveryDiagnostics = diagnostico || null;
  if (!diagnostico) {
    content.innerHTML = '<div class="discovery-diagnostic-loading">Diagnóstico indisponível.</div>';
    return;
  }

  const interfaces = Array.isArray(diagnostico.interfaces) ? diagnostico.interfaces : [];
  const issues = Array.isArray(diagnostico.issues) ? diagnostico.issues : [];
  const targets = Array.isArray(diagnostico.lastScanTargets) ? diagnostico.lastScanTargets : [];
  const socketOk = Boolean(diagnostico.socketReady);
  const ativos = Number(diagnostico.activeDevices || 0);

  const interfaceHtml = interfaces.length
    ? interfaces.map(item => `<span class="diagnostic-chip"><i class="fa-solid fa-network-wired"></i>${escaparHtml(item.name || "Rede")}: ${escaparHtml(item.address || "-")}</span>`).join("")
    : '<span class="diagnostic-chip warning"><i class="fa-solid fa-triangle-exclamation"></i>Nenhuma interface IPv4 privada detectada</span>';

  const issuesHtml = issues.length
    ? `<div class="diagnostic-issues">${issues.map(issue => `
        <div class="diagnostic-issue ${escaparHtml(issue.severity || "info")}">
          <i class="fa-solid ${issue.severity === "error" ? "fa-circle-xmark" : issue.severity === "warning" ? "fa-triangle-exclamation" : "fa-circle-info"}"></i>
          <span>${escaparHtml(issue.message || "Diagnóstico de rede")}</span>
        </div>`).join("")}
      </div>`
    : '<div class="diagnostic-ok"><i class="fa-solid fa-circle-check"></i>Nenhum problema de descoberta foi identificado pelo backend.</div>';

  content.innerHTML = `
    <div class="diagnostic-summary-grid">
      <div><small>Listener UDP/${escaparHtml(diagnostico.port)}</small><b class="${socketOk ? "ok" : "erro"}">${socketOk ? "ATIVO" : "INDISPONÍVEL"}</b></div>
      <div><small>Equipamentos visíveis</small><b>${ativos}</b></div>
      <div><small>Última resposta válida</small><b>${escaparHtml(formatarHorarioDiagnostico(diagnostico.lastValidPacketAt))}</b></div>
      <div><small>Broadcasts da última busca</small><b>${targets.length || 0}</b></div>
    </div>
    <div class="diagnostic-interface-list">${interfaceHtml}</div>
    ${issuesHtml}
    <p class="diagnostic-footnote">Se o UDP estiver bloqueado, use <strong>Detectar pelo IP</strong>. O fallback consulta apenas <code>/steelcontrol/discovery</code> em IPv4 privado/local e não envia START.</p>`;

  // Mantém o diagnóstico recolhido por padrão para a tela ficar compacta.
  // Depois que o usuário abrir/fechar manualmente, respeitamos a escolha dele.
  if (details && !details.dataset.userToggled) {
    details.open = false;
  }
}

const discoveryDetailsElement = document.getElementById("discoveryDiagnostics");
if (discoveryDetailsElement && !discoveryDetailsElement.dataset.compactListener) {
  discoveryDetailsElement.addEventListener("toggle", () => {
    discoveryDetailsElement.dataset.userToggled = "1";
  });
  discoveryDetailsElement.dataset.compactListener = "1";
}

async function carregarDiagnosticoDescoberta({ silencioso = true } = {}) {
  if (!usuarioEhAdministrador()) return;
  try {
    const resposta = await fetchAutenticado(`${API_URL}/descoberta/diagnostico`, { cache: "no-store" });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados?.mensagem || "Não foi possível obter o diagnóstico da rede.");
    renderDiagnosticoDescoberta(dados);
  } catch (erro) {
    if (!silencioso) discoveryMessage(erro?.message || "Diagnóstico de descoberta indisponível.", "erro");
  }
}

async function descobrirDispositivoPorIp() {
  if (!usuarioEhAdministrador()) return;
  const ipInput = document.getElementById("discoveryIpInput");
  const portInput = document.getElementById("discoveryPortInput");
  const button = document.getElementById("discoveryIpBtn");
  const host = String(ipInput?.value || "").trim();
  const port = Number(portInput?.value || 80);

  if (!host) {
    discoveryMessage("Informe o IPv4 do equipamento, por exemplo 192.168.0.87.", "erro");
    ipInput?.focus();
    return;
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    discoveryMessage("Informe uma porta válida entre 1 e 65535.", "erro");
    portInput?.focus();
    return;
  }

  if (button) button.disabled = true;
  discoveryMessage(`Consultando ${host}:${port} pelo fallback IP...`);
  try {
    const resposta = await fetchAutenticado(`${API_URL}/descoberta/por-ip`, {
      method: "POST",
      body: JSON.stringify({ host, port })
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      if (dados?.diagnostico) renderDiagnosticoDescoberta(dados.diagnostico);
      throw new Error(dados?.mensagem || "Nenhum equipamento SteelControl foi identificado nesse IP.");
    }

    discoveryMessage(dados.mensagem || "Equipamento identificado pelo IP.", "sucesso");
    await carregarDispositivosDescobertos({ silencioso: true });
    await carregarDiagnosticoDescoberta({ silencioso: true });
  } catch (erro) {
    discoveryMessage(erro?.message || "Falha ao detectar o equipamento pelo IP.", "erro");
    await carregarDiagnosticoDescoberta({ silencioso: true });
  } finally {
    if (button) button.disabled = false;
  }
}

function renderDispositivosDescobertos() {
  const grid = document.getElementById("discoveredDevicesGrid");
  if (!grid) return;

  if (!dispositivosDescobertos.length) {
    grid.innerHTML = `
      <div class="discovery-empty">
        Nenhum equipamento respondeu ainda. Abra o SteelControl Edge para detectar USB/Serial ou use “Procurar novamente” para equipamentos de rede.
      </div>`;
    return;
  }

  grid.innerHTML = dispositivosDescobertos.map(device => {
    const controlador = formatarControladorLista(device.controller);
    const protocolo = formatarProtocoloLista(device.protocol);
    const claimedHere = Boolean(device.claimedByThisCompany);
    const claimed = Boolean(device.claimed);
    const disabled = claimed ? "disabled" : "";
    const buttonLabel = claimedHere ? "Já adicionado" : claimed ? "Indisponível" : "Adicionar ao SteelControl";
    const buttonIcon = claimed ? "fa-circle-check" : "fa-link";

    return `
      <article class="discovered-device-card">
        <div class="discovered-device-top">
          <div class="discovered-device-icon"><i class="fa-solid fa-microchip"></i></div>
          <div class="discovered-device-copy">
            <strong>${escaparHtml(device.name || "Equipamento encontrado")}</strong>
            <span>${escaparHtml(device.manufacturer || "Fabricante não informado")} • ${escaparHtml(device.model || "Modelo não informado")}</span>
          </div>
          <span class="discovery-online">${escaparHtml(device.discoverySource || "LAN")}</span>
        </div>
        <div class="discovered-device-meta">
          <div><small>Controlador</small><b>${escaparHtml(controlador)}</b></div>
          <div><small>Protocolo</small><b>${escaparHtml(protocolo)}</b></div>
          <div><small>Endereço</small><b>${escaparHtml(device.host)}:${escaparHtml(device.port)}</b></div>
          <div><small>Último sinal</small><b>${escaparHtml(formatarTempoDescoberta(device.lastSeenAt))}</b></div>
        </div>
        <button type="button" class="discovery-approve-btn" ${disabled}
          onclick="aprovarDispositivoDescoberto('${encodeURIComponent(device.id)}')">
          <i class="fa-solid ${buttonIcon}"></i> ${buttonLabel}
        </button>
      </article>`;
  }).join("");
}

async function carregarDispositivosDescobertos({ silencioso = false } = {}) {
  if (!usuarioEhAdministrador()) return;
  try {
    const resposta = await fetchAutenticado(`${API_URL}/descoberta`, { cache: "no-store" });
    const dados = await resposta.json().catch(() => []);
    if (!resposta.ok) throw new Error(dados?.mensagem || "Não foi possível consultar a descoberta automática.");
    dispositivosDescobertos = Array.isArray(dados) ? dados : [];
    renderDispositivosDescobertos();
    if (!silencioso && dispositivosDescobertos.length) {
      discoveryMessage(`${dispositivosDescobertos.length} equipamento(s) compatível(is) encontrado(s) na rede/Edge.`, "sucesso");
    }
  } catch (erro) {
    if (!silencioso) discoveryMessage(erro?.message || "Erro ao consultar equipamentos da rede.", "erro");
  }
}

async function varrerDispositivos() {
  if (!usuarioEhAdministrador()) return;
  const button = document.getElementById("discoveryScanBtn");
  const label = button?.querySelector("span");
  if (button) button.disabled = true;
  if (label) label.textContent = "Procurando...";
  discoveryMessage("Procurando equipamentos SteelControl na rede local...");
  try {
    const resposta = await fetchAutenticado(`${API_URL}/descoberta/varrer`, { method: "POST" });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível iniciar a busca.");
    discoveryMessage(dados.mensagem || "Busca enviada. Aguardando respostas...");
    await new Promise(resolve => setTimeout(resolve, 1400));
    await carregarDispositivosDescobertos();
    await carregarDiagnosticoDescoberta({ silencioso: true });
    setTimeout(async () => {
      await carregarDispositivosDescobertos({ silencioso: true });
      await carregarDiagnosticoDescoberta({ silencioso: true });
    }, 2300);
  } catch (erro) {
    discoveryMessage(erro?.message || "Erro ao buscar equipamentos.", "erro");
    await carregarDiagnosticoDescoberta({ silencioso: true });
  } finally {
    if (button) button.disabled = false;
    if (label) label.textContent = "Procurar novamente";
  }
}

async function aprovarDispositivoDescoberto(encodedId) {
  if (!usuarioEhAdministrador()) return;
  const id = decodeURIComponent(encodedId);
  const device = dispositivosDescobertos.find(item => item.id === id);
  if (!device || device.claimed) return;

  const confirmado = window.confirm(
    `Adicionar "${device.name}" ao SteelControl?\n\n` +
    `IP: ${device.host}\nControlador: ${formatarControladorLista(device.controller)}\n\n` +
    "O monitoramento será provisionado automaticamente quando o dispositivo suportar. O controle remoto continuará DESATIVADO por segurança."
  );
  if (!confirmado) return;

  discoveryMessage(`Provisionando ${device.name}...`);
  try {
    const resposta = await fetchAutenticado(`${API_URL}/descoberta/${encodeURIComponent(id)}/aprovar`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível adicionar o equipamento.");

    discoveryMessage(dados.mensagem || "Equipamento adicionado.", "sucesso");
    if (dados.deviceKey) {
      mostrarDeviceKey(dados.deviceKey, "Chave do equipamento — configuração manual necessária", dados.maquinaId);
    }
    await Promise.all([carregarMaquinas(), carregarDispositivosDescobertos({ silencioso: true })]);
  } catch (erro) {
    discoveryMessage(erro?.message || "Falha no provisionamento.", "erro");
  }
}

function iniciarDescobertaAutomatica() {
  const box = document.getElementById("deviceDiscoveryBox");
  if (!box || !usuarioEhAdministrador()) return;
  box.hidden = false;
  carregarDispositivosDescobertos({ silencioso: true });
  carregarDiagnosticoDescoberta({ silencioso: true });
  varrerDispositivos();
  if (discoveryRefreshTimer) clearInterval(discoveryRefreshTimer);
  discoveryRefreshTimer = setInterval(() => {
    if (document.visibilityState === "visible") carregarDispositivosDescobertos({ silencioso: true });
  }, 6000);
}

// =========================================================
// CARREGAR
// =========================================================

async function carregarMaquinas() {

  maquinasGrid.innerHTML = `

    <div class="carregando">

      <i class="fa-solid fa-spinner fa-spin"></i>

      Carregando equipamentos...

    </div>

  `;


  try {

    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas`
      );


    if (
      resposta.status === 401
    ) {

      localStorage.removeItem(
        "autenticado"
      );

      localStorage.removeItem(
        "token"
      );

      window.location.href =
        "/app/login";

      return;

    }


    if (
      !resposta.ok
    ) {

      let mensagem =
        "Erro ao buscar equipamentos.";

      try {

        const erroApi =
          await resposta.json();

        mensagem =
          erroApi.mensagem ||
          mensagem;

      } catch (_) {}

      throw new Error(
        mensagem
      );

    }


    const dados =
      await resposta.json();


    maquinas =
      Array.isArray(dados)
        ? dados
        : [];


    atualizarResumo();


    aplicarFiltros();


  } catch (erro) {

    console.error(
      "Erro:",
      erro
    );


    const detalhe =
      escaparHtml(
        erro?.message ||
        "Não foi possível comunicar com a API."
      );


    maquinasGrid.innerHTML = `

      <div class="erro-api">

        <h3>
          Não foi possível carregar os equipamentos
        </h3>

        <p>
          ${detalhe}
        </p>

        <button
          type="button"
          class="machine-card-btn"
          onclick="carregarMaquinas()"
        >
          <i class="fa-solid fa-rotate-right"></i>
          Tentar novamente
        </button>

      </div>

    `;

  }

}


// =========================================================
// RESUMO
// =========================================================

function atualizarResumo() {

  const total =
    maquinas.length;


  const ligadas =
    maquinas.filter(
      maquina =>
        statusAtualMaquina(maquina).valor ===
        "Ligada"
    ).length;


  const manutencao =
    maquinas.filter(
      maquina =>
        statusAtualMaquina(maquina).valor ===
        "Manutenção"
    ).length;


  const alertas =
    maquinas.filter(
      maquina =>
        statusAtualMaquina(maquina).valor ===
        "Alerta"
    ).length;


  atualizarTexto(
    "totalMaquinas",
    total
  );


  atualizarTexto(
    "totalLigadas",
    ligadas
  );


  atualizarTexto(
    "totalManutencao",
    manutencao
  );


  atualizarTexto(
    "totalAlertas",
    alertas
  );

}


function atualizarTexto(
  id,
  valor
) {

  const elemento =
    document.getElementById(
      id
    );


  if (
    elemento
  ) {

    elemento.textContent =
      valor;

  }

}


// =========================================================
// STATUS
// =========================================================

function traduzirStatus(
  status
) {

  let base =
    status ||
    "Sem status";

  if (status === "Ligada") {
    base = "Em operação";
  }

  return traduzirLiteralMaquinas(
    base
  );
}


// =========================================================
// ÍCONE
// =========================================================

function escolherIcone(
  maquina
) {

  const texto =
    `${maquina.nome || ""} ${maquina.tipo || ""}`
      .toLowerCase();


  if (
    texto.includes(
      "braço"
    ) ||
    texto.includes(
      "braco"
    ) ||
    texto.includes(
      "robô"
    ) ||
    texto.includes(
      "robo"
    )
  ) {

    return "fa-robot";

  }


  if (
    texto.includes(
      "esteira"
    )
  ) {

    return "fa-gears";

  }


  if (
    texto.includes(
      "prensa"
    )
  ) {

    return "fa-screwdriver-wrench";

  }


  if (
    texto.includes(
      "solda"
    )
  ) {

    return "fa-fire-flame-curved";

  }


  if (
    texto.includes(
      "torno"
    )
  ) {

    return "fa-industry";

  }


  if (
    texto.includes(
      "corte"
    )
  ) {

    return "fa-scissors";

  }


  if (
    texto.includes(
      "embalagem"
    )
  ) {

    return "fa-box";

  }


  if (
    texto.includes(
      "cnc"
    )
  ) {

    return "fa-microchip";

  }


  return "fa-gears";

}


// =========================================================
// CLASSE STATUS
// =========================================================

function classeStatus(
  status
) {

  if (status === "Offline") {
    return "offline-status";
  }

  if (status === "Instável" || status === "Conexão instável") {
    return "unstable-status";
  }

  if (
    status === "Alerta"
  ) {

    return "alerta-status";

  }


  if (
    status === "Manutenção"
  ) {

    return "manutencao-status";

  }


  return "ligado";

}


// =========================================================
// CARD
// =========================================================

const PERFIS_CONTROLADOR = Object.freeze({
  ESP32: { nome: "ESP32", painel: "ESP32", icone: "fa-wifi", descricao: "Painel IoT para sensores, conectividade Wi-Fi, sinal, latência e telemetria HTTP ou MQTT.", recursos: ["Sensores", "Wi-Fi / RSSI", "GPIO", "Heartbeat", "Telemetria"], protocolo: "HTTP_REST" },
  DOBOT_MAGICIAN: { nome: "Dobot Magician", painel: "Dobot", icone: "fa-robot", descricao: "Painel robótico dedicado para pose cartesiana, juntas, efetuador, fila de comandos e USB serial.", recursos: ["XYZ/R", "Juntas J1–J4", "Ventosa", "Garra", "Comandos"], protocolo: "USB_SERIAL" },
  CLP_PLC: { nome: "CLP / PLC", painel: "PLC", icone: "fa-server", descricao: "Painel de automação para entradas, saídas, registradores, ciclo de varredura, processo e alarmes.", recursos: ["Entradas e saídas", "Registradores", "Scan", "Processo", "Alarmes"], protocolo: "MODBUS_TCP" },
  CONTROLADOR_ROBOTICO: { nome: "Controlador robótico", painel: "Robótica", icone: "fa-robot", descricao: "Painel de célula robótica para eixos, ferramenta, ciclos, modo de operação e segurança.", recursos: ["Eixos", "Ferramenta", "Ciclos", "Modo", "Segurança"], protocolo: "OPC_UA" },
  CNC: { nome: "Controlador CNC", painel: "CNC", icone: "fa-gears", descricao: "Painel de usinagem para spindle, avanço, ferramenta, programa, peças e tempo de ciclo.", recursos: ["Spindle", "Avanço", "Ferramenta", "Programa", "Produção"], protocolo: "TCP_IP" },
  GATEWAY_INDUSTRIAL: { nome: "Gateway industrial", painel: "Gateway", icone: "fa-network-wired", descricao: "Painel de conectividade para dispositivos, protocolos, tráfego, latência e integridade do gateway.", recursos: ["Dispositivos", "Protocolos", "Tráfego", "Latência", "Saúde"], protocolo: "MQTT" },
  OUTRO: { nome: "Equipamento genérico", painel: "Genérico", icone: "fa-microchip", descricao: "Painel industrial flexível para telemetria, comunicação e campos adicionais enviados pelo equipamento.", recursos: ["Telemetria", "Comunicação", "Alertas", "Produção", "Dados extras"], protocolo: "" }
});

function obterPerfilControlador(controlador) {
  return PERFIS_CONTROLADOR[String(controlador || "").toUpperCase()] || null;
}

function atualizarPerfilControlador() {
  const controlador = document.getElementById("controladorInput")?.value || "";
  const perfil = obterPerfilControlador(controlador);
  const painel = document.getElementById("controllerProfilePanel");
  if (!painel) return;

  painel.hidden = !perfil;
  if (!perfil) return;

  const titulo = document.getElementById("controllerProfileTitle");
  const descricao = document.getElementById("controllerProfileDescription");
  const icone = document.getElementById("controllerProfileIcon");
  const recursos = document.getElementById("controllerProfileFeatures");
  if (titulo) titulo.textContent = `Painel ${perfil.painel}`;
  if (descricao) descricao.textContent = perfil.descricao;
  if (icone) icone.className = `fa-solid ${perfil.icone}`;
  if (recursos) recursos.innerHTML = perfil.recursos.map(recurso => `<span>${escaparHtml(recurso)}</span>`).join("");

  const modo = document.getElementById("modoOperacaoInput");
  const protocolo = document.getElementById("protocoloInput");
  if (modo) modo.value = "real";
  if (protocolo && !protocolo.value && perfil.protocolo) protocolo.value = perfil.protocolo;
  atualizarAjudaModoOperacao();
}

document.getElementById("controladorInput")?.addEventListener("change", atualizarPerfilControlador);
atualizarPerfilControlador();

function atualizarPainelIhm() {
  const controlador = String(document.getElementById("controladorInput")?.value || "").toUpperCase();
  const modo = document.getElementById("modoOperacaoInput")?.value || "simulacao";
  const painel = document.getElementById("hmiConfigPanel");
  const check = document.getElementById("hmiRemoteEnabledInput");
  if (!painel) return;
  const visivel = Boolean(controlador) && controlador !== "DOBOT_MAGICIAN";
  painel.hidden = !visivel;
  if (check) {
    check.disabled = !visivel || modo !== "real";
    if (modo !== "real") check.checked = false;
  }
}

document.getElementById("controladorInput")?.addEventListener("change", atualizarPainelIhm);
document.getElementById("modoOperacaoInput")?.addEventListener("change", atualizarPainelIhm);
atualizarPainelIhm();

function criarCardMaquina(
  maquina
) {

  const article =
    document.createElement(
      "article"
    );


  const ehDobot =
    String(maquina.controlador || "")
      .toUpperCase() === "DOBOT_MAGICIAN";

  const perfilControlador = obterPerfilControlador(maquina.controlador);
  const temPainelControlador = Boolean(perfilControlador);


  article.className =
    `maquina-card${temPainelControlador ? " dobot-machine-card" : ""}`;


  const icone =
    escolherIcone(
      maquina
    );


  const statusAtual =
    statusAtualMaquina(
      maquina
    );

  const statusClass =
    statusAtual.classe;

  const conexao =
    statusConexaoLista(maquina);


  const temperatura =
    Number(
      maquina.temperatura ||
      0
    );


  const producao =
    Number(
      maquina.producao ||
      0
    );


  const ciclos =
    Number(
      maquina.ciclos ||
      0
    );


  const energia =
    Number(
      maquina.consumoEnergia ||
      0
    );


  article.innerHTML = `

    <div class="card-top">

      <div class="machine-icon">

        <i class="fa-solid ${icone}"></i>

      </div>


      <span class="status ${statusClass}">

        ${escaparHtml(
          statusAtual.texto
        )}

      </span>

    </div>


    <span class="machine-category">

      ${escaparHtml(
        maquina.tipo ||
        "Equipamento industrial"
      )}

    </span>

    ${
      temPainelControlador
        ? `
          <span class="dobot-dashboard-badge">
            <i class="fa-solid ${perfilControlador.icone}"></i>
            Painel ${escaparHtml(perfilControlador.painel)} disponível
          </span>
        `
        : ""
    }


    <h3>

      ${escaparHtml(
        maquina.nome
      )}

    </h3>


    <div class="machine-sector">

      <i class="fa-solid fa-location-dot"></i>

      ${escaparHtml(
        maquina.setor
      )}

    </div>


    <p class="machine-description">

      ${escaparHtml(
        maquina.descricao ||
        "Nenhuma descrição cadastrada."
      )}

    </p>


    <div class="machine-identification">

      <div>

        <span>
          Fabricante
        </span>

        <strong>
          ${escaparHtml(
            maquina.fabricante ||
            "Não informado"
          )}
        </strong>

      </div>


      <div>

        <span>
          Modelo
        </span>

        <strong>
          ${escaparHtml(
            maquina.modelo ||
            "-"
          )}
        </strong>

      </div>


      <div>

        <span>
          Código
        </span>

        <strong>
          ${escaparHtml(
            maquina.codigo ||
            "-"
          )}
        </strong>

      </div>


      <div>

        <span>
          Setor
        </span>

        <strong>
          ${escaparHtml(
            maquina.setor ||
            "-"
          )}
        </strong>

      </div>

    </div>


    <div class="machine-metrics">

      <div class="metric">

        <i class="fa-solid fa-temperature-half"></i>

        <strong>
          ${temperatura}°C
        </strong>

        <span>
          Temperatura
        </span>

      </div>


      <div class="metric">

        <i class="fa-solid fa-rotate"></i>

        <strong>
          ${ciclos}
        </strong>

        <span>
          Ciclos
        </span>

      </div>


      <div class="metric">

        <i class="fa-solid fa-bolt"></i>

        <strong>
          ${energia}%
        </strong>

        <span>
          Carga elétrica
        </span>

      </div>

    </div>


    <div class="machine-connection">
      <i class="fa-solid fa-network-wired"></i>
      <div>
        <span>
          Comunicação
        </span>
        <strong>
          ${
            maquina.protocolo
              ? `${escaparHtml(formatarControladorLista(maquina.controlador))} • ${escaparHtml(formatarProtocoloLista(maquina.protocolo))}${
                  maquina.host
                    ? ` • ${escaparHtml(maquina.host)}${maquina.porta ? `:${maquina.porta}` : ""}`
                    : ""
                }`
              : "Configurar quando integrar o equipamento"
          }
        </strong>
        <span class="machine-connection-state ${conexao.classe}">${conexao.texto}</span>
      </div>
    </div>


    <div class="machine-maintenance">

      <i class="fa-solid fa-screwdriver-wrench"></i>


      <div>

        <span>
          Situação de manutenção
        </span>

        <strong>
          ${escaparHtml(
            maquina.manutencao ||
            "Normal"
          )}
        </strong>

      </div>

    </div>


    <div class="machine-card-actions">

      <button
        type="button"
        class="machine-card-btn${temPainelControlador ? " dobot-dashboard-btn" : ""}"
      >
        <span>
          ${
            temPainelControlador
              ? `Abrir painel ${escaparHtml(perfilControlador.painel)}`
              : textoMaquinas("abrirMonitoramento", "Abrir monitoramento")
          }
        </span>
        <i class="fa-solid ${temPainelControlador ? perfilControlador.icone : "fa-arrow-right"}"></i>
      </button>

      ${
        usuarioEhAdministrador()
          ? `
            <button
              type="button"
              class="machine-edit-btn"
              title="Editar equipamento e conexão"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              ${textoMaquinas("editar", "Editar")}
            </button>

            <button
              type="button"
              class="machine-key-btn"
              title="Gerar nova chave do equipamento"
            >
              <i class="fa-solid fa-key"></i>
              Chave
            </button>

            <button
              type="button"
              class="machine-delete-btn"
              title="${textoMaquinas("removerEquipamento", "Remover equipamento")}"
            >
              <i class="fa-solid fa-trash-can"></i>
              ${textoMaquinas("remover", "Remover")}
            </button>
          `
          : ""
      }

    </div>

  `;


  article
    .querySelector(
      ".machine-card-btn"
    )
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();


        abrirDashboard(
          maquina
        );

      }
    );


  const botaoEditar =
    article.querySelector(
      ".machine-edit-btn"
    );

  if (botaoEditar) {
    botaoEditar.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();
        editarMaquina(maquina);
      }
    );
  }


  const botaoChave =
    article.querySelector(
      ".machine-key-btn"
    );

  if (botaoChave) {
    botaoChave.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();
        renovarChaveMaquina(maquina);
      }
    );
  }

  const botaoRemover =
    article.querySelector(
      ".machine-delete-btn"
    );

  if (botaoRemover) {
    botaoRemover.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();
        removerMaquina(maquina);
      }
    );
  }


  article.addEventListener(
    "click",
    () => {

      abrirDashboard(
        maquina
      );

    }
  );


  return article;

}


// =========================================================
// RENDERIZAR
// =========================================================

function renderizarMaquinas(
  lista
) {

  maquinasGrid.innerHTML =
    "";


  if (
    lista.length === 0
  ) {

    maquinasGrid.innerHTML = `

      <div class="empty-machines">

        <div class="empty-machines-icon">

          <i class="fa-solid fa-robot"></i>

        </div>


        <h3>
          Nenhum equipamento encontrado
        </h3>


        <p>

          Cadastre uma máquina ou braço robótico
          para iniciar o monitoramento industrial.

        </p>

      </div>

    `;


    return;

  }


  lista.forEach(
    maquina => {

      maquinasGrid.appendChild(
        criarCardMaquina(
          maquina
        )
      );

    }
  );

}


// =========================================================
// EDITAR EQUIPAMENTO / CONEXÃO
// =========================================================

function editarMaquina(
  maquina
) {
  if (
    !usuarioEhAdministrador()
  ) {
    return;
  }

  maquinaEditandoId =
    Number(
      maquina.id
    );

  const valores = {
    nomeMaquinaInput:
      maquina.nome || "",
    setorMaquinaInput:
      maquina.setor || "",
    tipoInput:
      maquina.tipo || "",
    modeloMaquinaInput:
      maquina.modelo || "",
    fabricanteInput:
      maquina.fabricante || "",
    codigoInput:
      maquina.codigo || "",
    descricaoInput:
      maquina.descricao || "",
    modoOperacaoInput:
      maquina.modoSimulacao === false
        ? "real"
        : "simulacao",
    controladorInput:
      maquina.controlador || "",
    protocoloInput:
      maquina.protocolo || "",
    hostInput:
      maquina.host || "",
    portaInput:
      maquina.porta ?? "",
    unitIdInput:
      maquina.unitId ?? "",
    endpointInput:
      maquina.endpoint || "",
    topicoInput:
      maquina.topico || "",
    intervaloLeituraInput:
      maquina.intervaloLeitura ?? 2000,
    tempAtencaoInput:
      maquina.tempAtencao ?? 55,
    tempCriticaInput:
      maquina.tempCritica ?? 70,
    energiaAtencaoInput:
      maquina.energiaAtencao ?? 80,
    energiaCriticaInput:
      maquina.energiaCritica ?? 90,
    vibracaoAtencaoInput:
      maquina.vibracaoAtencao ?? 4,
    vibracaoCriticaInput:
      maquina.vibracaoCritica ?? 7,
    ciclosManutencaoInput:
      maquina.ciclosManutencao ?? 1000
  };

  Object.entries(
    valores
  ).forEach(
    ([id, valor]) => {
      const campo =
        document.getElementById(
          id
        );

      if (campo) {
        campo.value =
          valor;
      }
    }
  );

  const dobot = maquina.integracaoMeta?.dobot || {};
  const dobotMode = document.getElementById("dobotModeInput");
  const dobotPort = document.getElementById("dobotPortInput");
  const dobotBaud = document.getElementById("dobotBaudInput");
  const dobotMotion = document.getElementById("dobotAllowMotionInput");
  if (dobotMode) dobotMode.value = String(dobot.mode || "MOCK").toUpperCase();
  if (dobotPort) dobotPort.value = dobot.port || "AUTO";
  if (dobotBaud) dobotBaud.value = Number(dobot.baudRate || 115200);
  if (dobotMotion) dobotMotion.checked = Boolean(dobot.allowMotion);

  const hmiRemote = document.getElementById("hmiRemoteEnabledInput");
  if (hmiRemote) hmiRemote.checked = Boolean(maquina.integracaoMeta?.hmi?.remoteControlEnabled);

  atualizarAjudaModoOperacao();
  atualizarPainelDobot();
  atualizarPerfilControlador();
  atualizarPainelIhm();

  formMaquina?.classList.add(
    "ativo"
  );

  const botaoSalvar =
    formMaquina?.querySelector(
      ".save-machine-btn"
    );

  if (botaoSalvar) {
    botaoSalvar.innerHTML = `
      <i class="fa-solid fa-floppy-disk"></i>
      ${textoMaquinas("salvarAlteracoes", "Salvar alterações")}
    `;
  }

  if (mensagemMaquina) {
    mensagemMaquina.textContent =
      `${textoMaquinas("editandoEquipamento", "Editando")} ${maquina.nome}.`;
    mensagemMaquina.className =
      "mensagem-maquina";
  }

  document
    .querySelector(
      ".cadastro-maquina-box"
    )
    ?.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });
}


// =========================================================
// REMOVER EQUIPAMENTO
// =========================================================

async function removerMaquina(
  maquina
) {
  if (
    !usuarioEhAdministrador()
  ) {
    alert(
      textoMaquinas(
        "somenteAdminRemoverEquipamento",
        "Somente administradores podem remover equipamentos."
      )
    );
    return;
  }

  const confirmar =
    window.SteelUI
      ? await SteelUI.confirm({
          titulo: "Desativar equipamento",
          mensagem:
            `"${maquina.nome}" será desativada. Telemetria, manutenções e auditoria serão preservadas.`,
          confirmar: "Desativar equipamento"
        })
      : window.confirm(
          `Desativar "${maquina.nome}"?`
        );

  if (!confirmar) {
    return;
  }

  try {
    const resposta =
      await fetchAutenticado(
        `${API_URL}/maquinas/${maquina.id}`,
        {
          method: "DELETE"
        }
      );

    const dados =
      await resposta
        .json()
        .catch(
          () => ({})
        );

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
        textoMaquinas(
          "erroRemoverEquipamento",
          "Não foi possível remover o equipamento."
        )
      );
    }

    window.SteelUI?.toast({
      tipo: "success",
      titulo: "Equipamento desativado",
      mensagem:
        dados.mensagem ||
        "O equipamento foi desativado e seu histórico foi preservado."
    });

    await carregarMaquinas();

  } catch (erro) {
    alert(
      erro.message ||
      textoMaquinas(
        "erroRemoverEquipamento",
        "Erro ao remover equipamento."
      )
    );
  }
}


// =========================================================
// FILTROS
// =========================================================

function aplicarFiltros() {

  const busca =
    (
      buscaMaquina?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const tipoSelecionado =
    filtroTipo?.value ||
    "todos";


  const statusSelecionado =
    filtroStatus?.value ||
    "todos";


  const filtradas =
    maquinas.filter(
      maquina => {

        const texto =
          `
            ${maquina.nome || ""}
            ${maquina.setor || ""}
            ${maquina.modelo || ""}
            ${maquina.fabricante || ""}
            ${maquina.codigo || ""}
            ${maquina.tipo || ""}
          `
            .toLowerCase();


        const combinaBusca =
          !busca ||
          texto.includes(
            busca
          );


        let combinaTipo =
          true;


        const tipo =
          (
            maquina.tipo ||
            ""
          )
            .toLowerCase();


        if (
          tipoSelecionado ===
          "robo"
        ) {

          combinaTipo =
            tipo.includes("robô") ||
            tipo.includes("robo") ||
            tipo.includes("braço") ||
            tipo.includes("braco");

        }


        if (
          tipoSelecionado ===
          "esteira"
        ) {

          combinaTipo =
            tipo.includes(
              "esteira"
            );

        }


        if (
          tipoSelecionado ===
          "prensa"
        ) {

          combinaTipo =
            tipo.includes(
              "prensa"
            );

        }


        if (
          tipoSelecionado ===
          "outro"
        ) {

          combinaTipo =
            !tipo.includes("robô") &&
            !tipo.includes("robo") &&
            !tipo.includes("braço") &&
            !tipo.includes("braco") &&
            !tipo.includes("esteira") &&
            !tipo.includes("prensa");

        }


        const combinaStatus =
          statusSelecionado ===
          "todos" ||
          statusAtualMaquina(maquina).valor ===
          statusSelecionado;


        return (
          combinaBusca &&
          combinaTipo &&
          combinaStatus
        );

      }
    );


  renderizarMaquinas(
    filtradas
  );

}


// =========================================================
// EVENTOS DE FILTRO
// =========================================================

buscaMaquina
  ?.addEventListener(
    "input",
    aplicarFiltros
  );


filtroTipo
  ?.addEventListener(
    "change",
    aplicarFiltros
  );


filtroStatus
  ?.addEventListener(
    "change",
    aplicarFiltros
  );


document
  .getElementById(
    "modoOperacaoInput"
  )
  ?.addEventListener(
    "change",
    atualizarAjudaModoOperacao
  );

atualizarAjudaModoOperacao();
atualizarPainelIhm();


// =========================================================
// CADASTRAR
// =========================================================

formMaquina
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const nome =
        document
          .getElementById(
            "nomeMaquinaInput"
          )
          .value
          .trim();


      const setor =
        document
          .getElementById(
            "setorMaquinaInput"
          )
          .value
          .trim();


      const modelo =
        document
          .getElementById(
            "modeloMaquinaInput"
          )
          .value
          .trim();


      const fabricante =
        document
          .getElementById(
            "fabricanteInput"
          )
          .value
          .trim();


      const codigo =
        document
          .getElementById(
            "codigoInput"
          )
          .value
          .trim();


      const tipo =
        document
          .getElementById(
            "tipoInput"
          )
          .value;


      const descricao =
        document
          .getElementById(
            "descricaoInput"
          )
          .value
          .trim();

      const modoOperacao =
        document
          .getElementById(
            "modoOperacaoInput"
          )
          ?.value ||
        "simulacao";

      const modoSimulacao =
        modoOperacao !==
        "real";


      const controlador =
        document
          .getElementById(
            "controladorInput"
          )
          ?.value ||
        "";


      const protocolo =
        document
          .getElementById(
            "protocoloInput"
          )
          ?.value ||
        "";

      const host =
        document
          .getElementById(
            "hostInput"
          )
          ?.value
          .trim() ||
        "";

      const portaValor =
        document
          .getElementById(
            "portaInput"
          )
          ?.value;

      const unitIdValor =
        document
          .getElementById(
            "unitIdInput"
          )
          ?.value;

      const endpoint =
        document
          .getElementById(
            "endpointInput"
          )
          ?.value
          .trim() ||
        "";

      const topico =
        document
          .getElementById(
            "topicoInput"
          )
          ?.value
          .trim() ||
        "";

      const intervaloLeitura =
        Number(document.getElementById("intervaloLeituraInput")?.value || 2000);

      const tempAtencao =
        Number(document.getElementById("tempAtencaoInput")?.value || 55);

      const tempCritica =
        Number(document.getElementById("tempCriticaInput")?.value || 70);

      const energiaAtencao =
        Number(document.getElementById("energiaAtencaoInput")?.value || 80);

      const energiaCritica =
        Number(document.getElementById("energiaCriticaInput")?.value || 90);

      const vibracaoAtencao =
        Number(document.getElementById("vibracaoAtencaoInput")?.value || 4);

      const vibracaoCritica =
        Number(document.getElementById("vibracaoCriticaInput")?.value || 7);

      const ciclosManutencao =
        Number(document.getElementById("ciclosManutencaoInput")?.value || 1000);

      const porta =
        portaValor
          ? Number(portaValor)
          : null;

      const unitId =
        unitIdValor
          ? Number(unitIdValor)
          : null;

      const integracaoMeta = controlador === "DOBOT_MAGICIAN"
        ? { dobot: {
            enabled: true,
            mode: String(document.getElementById("dobotModeInput")?.value || "MOCK").toUpperCase(),
            port: String(document.getElementById("dobotPortInput")?.value || "AUTO").trim().toUpperCase(),
            baudRate: Number(document.getElementById("dobotBaudInput")?.value || 115200),
            allowMotion: Boolean(document.getElementById("dobotAllowMotionInput")?.checked),
            externalSensors: { temperature: false, vibration: false, current: false }
          }}
        : controlador
          ? { hmi: {
              enabled: true,
              remoteControlEnabled: modoSimulacao
                ? false
                : Boolean(document.getElementById("hmiRemoteEnabledInput")?.checked)
            }}
          : null;


      if (
        !nome ||
        !setor ||
        !modelo ||
        !codigo
      ) {

        mensagemMaquina.textContent =
          "Preencha nome, setor, modelo e código do equipamento.";


        mensagemMaquina.className =
          "mensagem-maquina erro";


        return;

      }


      if (
        !modoSimulacao &&
        !controlador
      ) {

        mensagemMaquina.textContent =
          "Selecione o controlador ou gateway do equipamento real.";

        mensagemMaquina.className =
          "mensagem-maquina erro";

        return;

      }

      if (
        tempCritica <= tempAtencao ||
        energiaCritica <= energiaAtencao ||
        energiaAtencao < 0 ||
        energiaCritica > 100 ||
        vibracaoCritica <= vibracaoAtencao ||
        ciclosManutencao <= 0
      ) {
        mensagemMaquina.textContent =
          "Os limites críticos devem ser maiores que os limites de atenção e a carga elétrica deve permanecer entre 0 e 100%.";
        mensagemMaquina.className =
          "mensagem-maquina erro";
        return;
      }


      mensagemMaquina.textContent =
        maquinaEditandoId
          ? "Salvando alterações..."
          : "Cadastrando equipamento...";


      mensagemMaquina.className =
        "mensagem-maquina";


      try {

        const editando =
          Number.isInteger(
            maquinaEditandoId
          );

        const resposta =
          await fetchAutenticado(
            editando
              ? `${API_URL}/maquinas/${maquinaEditandoId}`
              : `${API_URL}/maquinas`,
            {

              method:
                editando
                  ? "PUT"
                  : "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  nome,
                  setor,
                  modelo,
                  fabricante,
                  codigo,
                  tipo,
                  descricao,
                  modoSimulacao,
                  controlador:
                    controlador || null,
                  protocolo:
                    protocolo || null,
                  host:
                    host || null,
                  porta,
                  unitId,
                  endpoint:
                    endpoint || null,
                  topico:
                    topico || null,
                  intervaloLeitura,
                  tempAtencao,
                  tempCritica,
                  energiaAtencao,
                  energiaCritica,
                  vibracaoAtencao,
                  vibracaoCritica,
                  ciclosManutencao,
                  integracaoMeta

                })

            }
          );


        const dados =
          await resposta.json();


        if (
          !resposta.ok
        ) {

          mensagemMaquina.textContent =
            dados.mensagem ||
            "Erro ao cadastrar equipamento.";


          mensagemMaquina.className =
            "mensagem-maquina erro";


          return;

        }


        mensagemMaquina.textContent =
          editando
            ? "Equipamento atualizado com sucesso!"
            : "Equipamento cadastrado com sucesso!";


        mensagemMaquina.className =
          "mensagem-maquina sucesso";

        if (dados.deviceKey) {
          mostrarDeviceKey(
            dados.deviceKey,
            editando
              ? "Chave gerada para o equipamento"
              : "Chave do novo equipamento",
            dados.maquina?.id || maquinaEditandoId
          );
        }


        formMaquina.reset();
        atualizarPainelDobot();
        atualizarPerfilControlador();
        atualizarPainelIhm();

        maquinaEditandoId =
          null;

        const botaoSalvar =
          formMaquina.querySelector(
            ".save-machine-btn"
          );

        if (botaoSalvar) {
          botaoSalvar.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Cadastrar equipamento
          `;
        }


        await carregarMaquinas();

        formMaquina.classList.remove(
          "ativo"
        );

        mensagemMaquina.textContent =
          "";


      } catch (erro) {

        console.error(
          "Erro:",
          erro
        );


        mensagemMaquina.textContent =
          "Erro ao conectar com o servidor.";


        mensagemMaquina.className =
          "mensagem-maquina erro";

      }

    }
  );


// =========================================================
// DASHBOARD
// =========================================================

function abrirDashboard(
  maquina
) {

  localStorage.setItem(
    "maquinaId",
    maquina.id
  );


  localStorage.setItem(
    "maquinaSelecionada",
    maquina.nome
  );


  localStorage.setItem(
    "setorSelecionado",
    maquina.setor
  );


  const ehDobot =
    String(maquina.controlador || "")
      .toUpperCase() === "DOBOT_MAGICIAN";

  const temPainelControlador =
    Boolean(obterPerfilControlador(maquina.controlador));


  const destinoDashboard =
    ehDobot
      ? "/app/dashboard?view=dobot"
      : temPainelControlador
        ? "/app/dashboard?view=controller"
        : "/app/dashboard?view=controller";


  localStorage.setItem(
    "dashboardMaquinaDestino",
    destinoDashboard
  );


  localStorage.setItem(
    "controladorSelecionado",
    String(maquina.controlador || "OUTRO")
  );


  window.location.href =
    destinoDashboard;

}


// =========================================================
// SAIR
// =========================================================

async function sair(confirmar = true) {

  if (confirmar) {

    const confirmado =
      await window.confirmarSaidaDaConta?.();


    if (!confirmado) return;

  }

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
    "cargoUsuario"
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


  window.location.href =
    "/app/login";

}


// =========================================================
// CONFIG
// =========================================================

window.addEventListener(
  "configAtualizada",
  () => {

    aplicarTemaSalvo();


    carregarMaquinas();

  }
);


// =========================================================
// INICIAR
// =========================================================

carregarMaquinas();

// =========================================================
// PERMISSÕES DE GESTÃO
// =========================================================

function aplicarPermissoesDeGestao() {
  if (
    usuarioEhAdministrador()
  ) {
    return;
  }

  document
    .querySelector(
      ".cadastro-maquina-box"
    )
    ?.remove();
}

aplicarPermissoesDeGestao();
iniciarDescobertaAutomatica();

// =====================================================
// SINCRONIZAÇÃO MULTI-DISPOSITIVO — LISTA DE MÁQUINAS
// =====================================================
let steelMaquinasRealtimeTimer = null;

window.addEventListener(
  "steelcontrol:empresa-evento",
  event => {
    const tipo = String(event.detail?.tipo || "");
    if (!tipo || tipo === "conectado") return;

    if (!tipo.startsWith("maquina.")) return;

    clearTimeout(steelMaquinasRealtimeTimer);
    steelMaquinasRealtimeTimer = setTimeout(() => {
      carregarMaquinas();
    }, 120);
  }
);
