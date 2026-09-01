(() => {
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  const machineId = localStorage.getItem("maquinaId");
  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (!token || !machineId || requestedView !== "controller") return;

  const profiles = {
    ESP32: {
      panel: "ESP32 / IoT", icon: "fa-wifi", accent: "#0891b2", dark: "#083344",
      description: "Sensores, conectividade Wi-Fi, sinal, latência e telemetria do dispositivo embarcado.",
      capabilities: ["Sensores", "Wi-Fi / RSSI", "GPIO", "Heartbeat", "HTTP / MQTT"],
      dataFields: ["temperatura", "vibracao", "corrente", "qualidadeSinal"],
      metrics: [
        ["Temperatura", (m) => m.temperatura, "°C"], ["Vibração", (m) => m.vibracao, "mm/s"],
        ["Corrente", (m) => m.corrente, "A"], ["Sinal Wi-Fi", (_, d) => d.qualidadeSinal, "%"]
      ]
    },
    CLP_PLC: {
      panel: "CLP / PLC", icon: "fa-server", accent: "#7c3aed", dark: "#2e1065",
      description: "Processo industrial, entradas e saídas, registradores, ciclo de varredura e alarmes do CLP.",
      capabilities: ["Entradas digitais", "Saídas digitais", "Registradores", "Scan", "Alarmes"],
      dataFields: ["plc.scanTimeMs", "plc.inputs", "plc.outputs", "plc.registers"],
      metrics: [
        ["Produção", (m) => m.producao, "un."], ["Ciclos", (m) => m.ciclos, "ciclos"],
        ["Tempo de scan", (_, __, e) => e?.plc?.scanTimeMs, "ms"], ["Entradas ativas", (_, __, e) => e?.plc?.activeInputs, "I/O"]
      ]
    },
    CONTROLADOR_ROBOTICO: {
      panel: "Célula robótica", icon: "fa-robot", accent: "#db2777", dark: "#500724",
      description: "Eixos, ferramenta, ciclos, modo de operação e informações de segurança da célula robótica.",
      capabilities: ["Eixos", "Ferramenta", "Ciclos", "Modo automático", "Segurança"],
      dataFields: ["robot.axes", "robot.tool", "robot.mode", "robot.safety"],
      metrics: [
        ["Ciclos", (m) => m.ciclos, "ciclos"], ["Produção", (m) => m.producao, "un."],
        ["Modo", (_, __, e) => e?.robot?.mode, ""], ["Quantidade de eixos", (_, __, e) => e?.robot?.axes?.length, "eixos"]
      ]
    },
    CNC: {
      panel: "CNC / Usinagem", icon: "fa-gears", accent: "#ea580c", dark: "#431407",
      description: "Spindle, avanço, ferramenta, programa, peças produzidas e desempenho do ciclo de usinagem.",
      capabilities: ["Spindle", "Avanço", "Ferramenta", "Programa CNC", "Contagem de peças"],
      dataFields: ["cnc.spindleRpm", "cnc.feedRate", "cnc.tool", "cnc.program"],
      metrics: [
        ["Spindle", (_, __, e) => e?.cnc?.spindleRpm, "RPM"], ["Avanço", (_, __, e) => e?.cnc?.feedRate, "mm/min"],
        ["Ferramenta", (_, __, e) => e?.cnc?.tool, ""], ["Peças produzidas", (m) => m.producao, "un."]
      ]
    },
    GATEWAY_INDUSTRIAL: {
      panel: "Gateway industrial", icon: "fa-network-wired", accent: "#16a34a", dark: "#052e16",
      description: "Dispositivos conectados, protocolos, tráfego, latência e integridade do gateway de integração.",
      capabilities: ["Dispositivos", "Protocolos", "Tráfego", "Conversão de dados", "Integridade"],
      dataFields: ["gateway.devicesOnline", "gateway.messagesPerMinute", "gateway.protocols", "qualidadeSinal"],
      metrics: [
        ["Dispositivos online", (_, __, e) => e?.gateway?.devicesOnline, "disp."], ["Mensagens/min", (_, __, e) => e?.gateway?.messagesPerMinute, "msg"],
        ["Qualidade do sinal", (_, d) => d.qualidadeSinal, "%"], ["Latência", (_, d) => d.latenciaMs, "ms"]
      ]
    },
    OUTRO: {
      panel: "Equipamento genérico", icon: "fa-microchip", accent: "#475569", dark: "#0f172a",
      description: "Telemetria e comunicação configuráveis para equipamentos que utilizam controladores proprietários.",
      capabilities: ["Telemetria", "Comunicação", "Alertas", "Produção", "Dados adicionais"],
      dataFields: ["temperatura", "vibracao", "corrente", "consumoEnergia"],
      metrics: [
        ["Temperatura", (m) => m.temperatura, "°C"], ["Vibração", (m) => m.vibracao, "mm/s"],
        ["Corrente", (m) => m.corrente, "A"], ["Energia", (m) => m.consumoEnergia, "%"]
      ]
    }
  };

  const $ = id => document.getElementById(id);
  const dom = {
    root: $("controllerTela"), hero: $("controllerHero"), icon: $("controllerHeroIcon"),
    eyebrow: $("controllerEyebrow"), title: $("controllerTitle"), description: $("controllerDescription"),
    state: $("controllerConnectionBadge"), protocol: $("controllerProtocol"), latency: $("controllerLatency"),
    signal: $("controllerSignal"), lastReading: $("controllerLastReading"), metrics: $("controllerMetrics"),
    integration: $("controllerIntegration"), capabilities: $("controllerCapabilities"), quality: $("controllerDataQuality")
  };

  let machine = null;
  let diagnostic = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function hasValue(value) {
    return value !== null && value !== undefined && value !== "";
  }

  function show(value, unit = "") {
    if (!hasValue(value)) return "Não configurado";
    const normalized = typeof value === "number" ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value) : String(value);
    return `${normalized}${unit ? ` ${unit}` : ""}`;
  }

  function formatProtocol(value) {
    return ({ MODBUS_TCP: "Modbus TCP", OPC_UA: "OPC UA", MQTT: "MQTT", HTTP_REST: "HTTP / REST", TCP_IP: "TCP/IP", OUTRO: "Proprietário" })[value] || value || "Não configurado";
  }

  function formatDate(value) {
    if (!value) return "Sem leitura";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Sem leitura" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function readPath(source, path) {
    return path.split(".").reduce((value, key) => value?.[key], source);
  }

  async function fetchAuth(url) {
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }

  function render() {
    if (!machine || !diagnostic) return;
    const code = String(machine.controlador || "").toUpperCase();

    if (code === "DOBOT_MAGICIAN") {
      window.location.replace("index.html?view=dobot");
      return;
    }

    const profile = profiles[code];
    if (!profile) {
      window.location.replace("maquinas.html");
      return;
    }

    const extras = diagnostic.dadosExtras || machine.dadosExtrasAtuais || {};
    const hasReading = Boolean(diagnostic.ultimaTelemetriaEm);
    dom.root?.style.setProperty("--controller-accent", profile.accent);
    dom.root?.style.setProperty("--controller-dark", profile.dark);
    if (dom.icon) dom.icon.className = `fa-solid ${profile.icon}`;
    if (dom.eyebrow) dom.eyebrow.textContent = `PAINEL ${profile.panel.toUpperCase()}`;
    if (dom.title) dom.title.textContent = machine.nome || profile.panel;
    if (dom.description) dom.description.textContent = profile.description;

    const stateCode = String(diagnostic.estadoConexao?.codigo || "OFFLINE").toUpperCase();
    const online = stateCode === "CONECTADA";
    const unstable = stateCode === "INSTAVEL";
    if (dom.state) {
      dom.state.className = `controller-state ${online ? "online" : unstable ? "unstable" : "offline"}`;
      dom.state.querySelector("strong").textContent = online ? "Controlador conectado" : unstable ? "Conexão instável" : "Aguardando telemetria";
    }

    if (dom.protocol) dom.protocol.textContent = formatProtocol(diagnostic.protocolo);
    if (dom.latency) dom.latency.textContent = show(diagnostic.latenciaMs, "ms");
    if (dom.signal) dom.signal.textContent = show(diagnostic.qualidadeSinal, "%");
    if (dom.lastReading) dom.lastReading.textContent = formatDate(diagnostic.ultimaTelemetriaEm);

    if (dom.metrics) {
      dom.metrics.innerHTML = profile.metrics.map(([label, getter, unit]) => {
        const value = hasReading ? getter(machine, diagnostic, extras) : null;
        return `<div class="controller-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(show(value, unit))}</strong><small>${hasValue(value) ? "Dado recebido/configurado" : "Aguardando o controlador"}</small></div>`;
      }).join("");
    }

    const integration = [
      ["Controlador", profile.panel], ["Protocolo", formatProtocol(diagnostic.protocolo)],
      ["Host", diagnostic.host || "Não configurado"], ["Porta", diagnostic.porta || "Não configurada"],
      ["Endpoint", diagnostic.endpoint || "Não configurado"], ["Tópico MQTT", diagnostic.topico || "Não configurado"],
      ["Origem da leitura", diagnostic.origemUltimaLeitura || "Sem leitura"], ["Comandos pendentes", diagnostic.comandosPendentes ?? 0]
    ];
    if (dom.integration) dom.integration.innerHTML = integration.map(([label, value]) => `<div class="controller-info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

    if (dom.capabilities) dom.capabilities.innerHTML = profile.capabilities.map(item => `<span class="controller-capability"><i class="fa-solid fa-check"></i>${escapeHtml(item)}</span>`).join("");

    if (dom.quality) {
      dom.quality.innerHTML = profile.dataFields.map(path => {
        const common = { temperatura: machine.temperatura, vibracao: machine.vibracao, corrente: machine.corrente, consumoEnergia: machine.consumoEnergia, qualidadeSinal: diagnostic.qualidadeSinal };
        const rawValue = Object.prototype.hasOwnProperty.call(common, path) ? common[path] : readPath(extras, path);
        const value = hasReading ? rawValue : null;
        const available = hasValue(value);
        return `<div class="controller-quality-row${available ? " available" : ""}"><i class="fa-solid ${available ? "fa-circle-check" : "fa-circle-minus"}"></i><span>${escapeHtml(path)}</span><strong>${available ? "Disponível" : "Não configurado"}</strong></div>`;
      }).join("");
    }

    window.mostrarTela?.("controller", null);
  }

  async function load() {
    try {
      const [machineResponse, diagnosticResponse] = await Promise.all([
        fetchAuth(`${API}/maquinas/${machineId}`), fetchAuth(`${API}/maquinas/${machineId}/diagnostico`)
      ]);
      if (!machineResponse.ok || !diagnosticResponse.ok) throw new Error("Não foi possível carregar o controlador.");
      machine = await machineResponse.json();
      diagnostic = await diagnosticResponse.json();
      render();
    } catch (error) {
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Painel do controlador", mensagem: error.message });
    }
  }

  window.addEventListener("steelcontrol:machine-diagnostic", event => {
    diagnostic = { ...(diagnostic || {}), ...(event.detail || {}) };
    render();
  });
  window.addEventListener("steelcontrol:machine-snapshot", event => {
    machine = { ...(machine || {}), ...(event.detail || {}) };
    render();
  });

  load();
  setInterval(load, 10000);
})();
