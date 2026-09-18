(() => {
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  const machineId = localStorage.getItem("maquinaId");
  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (!token || !machineId || requestedView !== "controller") return;

  const BRAND_ACCENT = "#c47b12";
  const BRAND_DARK = "#1e2225";

  const profiles = {
    ESP32: {
      panel: "ESP32 / IoT", icon: "fa-wifi", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Sensores, conectividade Wi-Fi, sinal, latência e telemetria do dispositivo embarcado.",
      capabilities: ["Sensores", "Wi-Fi / RSSI", "GPIO", "Heartbeat", "HTTP / MQTT", "IHM supervisionada"],
      dataFields: ["temperatura", "vibracao", "corrente", "qualidadeSinal"],
      metrics: [
        ["Temperatura", m => m.temperatura, "°C"], ["Vibração", m => m.vibracao, "mm/s"],
        ["Corrente", m => m.corrente, "A"], ["Sinal Wi-Fi", (_, d) => d.qualidadeSinal, "%"]
      ]
    },
    CLP_PLC: {
      panel: "CLP / PLC", icon: "fa-server", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Processo industrial, entradas e saídas, registradores, ciclo de varredura e alarmes do CLP.",
      capabilities: ["Entradas digitais", "Saídas digitais", "Registradores", "Scan", "Alarmes", "IHM supervisionada"],
      dataFields: ["plc.scanTimeMs", "plc.inputs", "plc.outputs", "plc.registers"],
      metrics: [
        ["Produção", m => m.producao, "un."], ["Ciclos", m => m.ciclos, "ciclos"],
        ["Tempo de scan", (_, __, e) => e?.plc?.scanTimeMs, "ms"], ["Entradas ativas", (_, __, e) => e?.plc?.activeInputs, "I/O"]
      ]
    },
    CONTROLADOR_ROBOTICO: {
      panel: "Célula robótica", icon: "fa-robot", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Eixos, ferramenta, ciclos, modo de operação e informações de segurança da célula robótica.",
      capabilities: ["Eixos", "Ferramenta", "Ciclos", "Modo automático", "Segurança", "IHM supervisionada"],
      dataFields: ["robot.axes", "robot.tool", "robot.mode", "robot.safety"],
      metrics: [
        ["Ciclos", m => m.ciclos, "ciclos"], ["Produção", m => m.producao, "un."],
        ["Modo", (_, __, e) => e?.robot?.mode, ""], ["Quantidade de eixos", (_, __, e) => e?.robot?.axes?.length, "eixos"]
      ]
    },
    CNC: {
      panel: "CNC / Usinagem", icon: "fa-gears", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Spindle, avanço, ferramenta, programa, peças produzidas e desempenho do ciclo de usinagem.",
      capabilities: ["Spindle", "Avanço", "Ferramenta", "Programa CNC", "Contagem de peças", "IHM supervisionada"],
      dataFields: ["cnc.spindleRpm", "cnc.feedRate", "cnc.tool", "cnc.program"],
      metrics: [
        ["Spindle", (_, __, e) => e?.cnc?.spindleRpm, "RPM"], ["Avanço", (_, __, e) => e?.cnc?.feedRate, "mm/min"],
        ["Ferramenta", (_, __, e) => e?.cnc?.tool, ""], ["Peças produzidas", m => m.producao, "un."]
      ]
    },
    IMPRESSORA_3D: {
      panel: "IHM Impressora 3D", icon: "fa-cube", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "IHM dedicada de produção aditiva para FDM/FFF, resina, SLS e outras tecnologias.",
      capabilities: ["Bico / mesa / câmara", "Progresso", "Camadas", "Tempo", "Material", "Monitoramento remoto"],
      dataFields: ["impressora3d.nozzle.current", "impressora3d.bed.current", "impressora3d.progress", "impressora3d.layer.current"],
      metrics: [
        ["Progresso", (_, __, e) => e?.impressora3d?.progress, "%"], ["Bico", (_, __, e) => e?.impressora3d?.nozzle?.current, "°C"],
        ["Mesa", (_, __, e) => e?.impressora3d?.bed?.current, "°C"], ["Camada", (_, __, e) => e?.impressora3d?.layer?.current, ""]
      ]
    },
    GATEWAY_INDUSTRIAL: {
      panel: "Gateway industrial", icon: "fa-network-wired", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Dispositivos conectados, protocolos, tráfego, latência e integridade do gateway de integração.",
      capabilities: ["Dispositivos", "Protocolos", "Tráfego", "Conversão de dados", "Integridade", "IHM supervisionada"],
      dataFields: ["gateway.devicesOnline", "gateway.messagesPerMinute", "gateway.protocols", "qualidadeSinal"],
      metrics: [
        ["Dispositivos online", (_, __, e) => e?.gateway?.devicesOnline, "disp."], ["Mensagens/min", (_, __, e) => e?.gateway?.messagesPerMinute, "msg"],
        ["Qualidade do sinal", (_, d) => d.qualidadeSinal, "%"], ["Latência", (_, d) => d.latenciaMs, "ms"]
      ]
    },
    OUTRO: {
      panel: "Equipamento genérico", icon: "fa-microchip", accent: BRAND_ACCENT, dark: BRAND_DARK,
      description: "Telemetria e comunicação configuráveis para equipamentos que utilizam controladores proprietários.",
      capabilities: ["Telemetria", "Comunicação", "Alertas", "Produção", "Dados adicionais", "IHM supervisionada"],
      dataFields: ["temperatura", "vibracao", "corrente", "consumoEnergia"],
      metrics: [
        ["Temperatura", m => m.temperatura, "°C"], ["Vibração", m => m.vibracao, "mm/s"],
        ["Corrente", m => m.corrente, "A"], ["Energia", m => m.consumoEnergia, "%"]
      ]
    }
  };

  const $ = id => document.getElementById(id);
  const dom = {
    root: $("controllerTela"), hero: $("controllerHero"), icon: $("controllerHeroIcon"),
    eyebrow: $("controllerEyebrow"), title: $("controllerTitle"), description: $("controllerDescription"),
    state: $("controllerConnectionBadge"), protocol: $("controllerProtocol"), latency: $("controllerLatency"),
    signal: $("controllerSignal"), lastReading: $("controllerLastReading"), metrics: $("controllerMetrics"),
    integration: $("controllerIntegration"), capabilities: $("controllerCapabilities"), quality: $("controllerDataQuality"),
    hmiConsole: $("hmiConsole"), hmiMode: $("hmiModeBadge"), hmiRun: $("hmiRunBadge"),
    hmiProcess: $("hmiProcessDiagram"), hmiFlow: $("hmiFlowStatus"), hmiMachineState: $("hmiMachineBlockState"),
    hmiProduction: $("hmiProduction"), hmiCycles: $("hmiCycles"), hmiTemp: $("hmiTemperature"), hmiVibration: $("hmiVibration"),
    hmiSensorEntry: $("hmiSensorEntry"), hmiSensorMiddle: $("hmiSensorMiddle"), hmiSensorExit: $("hmiSensorExit"),
    hmiInterlockStart: $("hmiInterlockStart"), hmiInterlockEstop: $("hmiInterlockEstop"), hmiInterlockDoor: $("hmiInterlockDoor"),
    hmiAlarm: $("hmiAlarmLamp"), hmiCommandState: $("hmiCommandState")
  };

  let machine = null;
  let diagnostic = null;
  let requestedViewHandled = false;
  let commandBusy = false;
  let loadSequence = 0;

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

  async function fetchAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(url, { cache: "no-store", ...options, headers });
  }

  function setLamp(element, value, positiveText, negativeText = "Bloqueado") {
    if (!element) return;
    element.classList.remove("ok", "bad", "warn");
    const strong = element.querySelector("strong");
    if (value === true) {
      element.classList.add("ok");
      if (strong) strong.textContent = positiveText;
    } else if (value === false) {
      element.classList.add("bad");
      if (strong) strong.textContent = negativeText;
    } else {
      element.classList.add("warn");
      if (strong) strong.textContent = "Não informado";
    }
  }

  function openDedicatedView() {
    if (requestedViewHandled || !machine) return;
    requestedViewHandled = true;
    const code = String(machine.controlador || "").toUpperCase();
    if (code === "DOBOT_MAGICIAN") {
      window.location.replace("/app/dashboard?view=dobot");
      return;
    }
    if (code === "IMPRESSORA_3D") {
      // Impressoras 3D possuem IHM exclusiva (câmera, trabalho, térmica, material e comandos).
      // Nunca renderize a IHM industrial genérica para este controlador.
      window.location.replace("/app/dashboard?view=printer3d");
      return;
    }
    if (!profiles[code]) {
      window.location.replace("/app/maquinas");
    }
  }

  function renderHmi(extras) {
    if (!dom.hmiConsole || !machine || !diagnostic) return;
    const hmi = diagnostic.hmi || extras?.hmi || {};
    const teleHmi = extras?.hmi || {};
    const metaHmi = machine?.integracaoMeta?.hmi && typeof machine.integracaoMeta.hmi === "object"
      ? machine.integracaoMeta.hmi
      : {};
    const simulation = diagnostic.modoSimulacao === true;
    const running = simulation
      ? (typeof metaHmi.running === "boolean" ? metaHmi.running : Boolean(hmi.running))
      : (typeof teleHmi.running === "boolean" ? teleHmi.running : Boolean(hmi.running));
    // Na simulação, integracaoMeta.hmi é o estado persistido pelo comando.
    // Em equipamento real, a telemetria continua sendo a fonte autoritativa.
    const mode = String(simulation
      ? (metaHmi.mode || hmi.mode || teleHmi.mode || "AUTO")
      : (teleHmi.mode || hmi.mode || metaHmi.mode || "AUTO")
    ).toUpperCase();
    const alarm = Boolean(machine.paradaSeguranca || teleHmi.alarm || hmi.alarm);
    const sensors = simulation ? (hmi.sensors || teleHmi.sensors || {}) : (teleHmi.sensors || hmi.sensors || {});
    const interlocks = simulation ? (hmi.interlocks || teleHmi.interlocks || {}) : (teleHmi.interlocks || hmi.interlocks || {});
    const connection = String(diagnostic.estadoConexao?.codigo || "OFFLINE").toUpperCase();
    const remoteEnabled = simulation || diagnostic.hmi?.remoteControlEnabled === true;
    const startAllowed = simulation
      ? diagnostic.hmi?.startPolicy?.permitido !== false
      : remoteEnabled && connection === "CONECTADA" && diagnostic.hmi?.startPolicy?.permitido === true;

    if (dom.hmiMode) dom.hmiMode.textContent = mode;
    if (dom.hmiRun) {
      dom.hmiRun.className = `hmi-pill ${running && !alarm ? "running" : "stopped"}`;
      const strong = dom.hmiRun.querySelector("strong");
      if (strong) strong.textContent = alarm ? "BLOQUEADA" : running ? "EM CICLO" : "PARADA";
    }
    dom.hmiProcess?.classList.toggle("running", running && !alarm);
    if (dom.hmiFlow) {
      dom.hmiFlow.className = `hmi-flow-status${alarm ? " alarm" : running ? " running" : ""}`;
      dom.hmiFlow.innerHTML = alarm
        ? '<i class="fa-solid fa-triangle-exclamation"></i> Processo bloqueado'
        : running
          ? '<i class="fa-solid fa-circle-play"></i> Processo em operação'
          : '<i class="fa-solid fa-circle-pause"></i> Processo parado';
    }
    if (dom.hmiMachineState) dom.hmiMachineState.textContent = alarm ? "BLOQUEADA" : running ? "OPERANDO" : "AGUARDANDO";

    if (dom.hmiProduction) dom.hmiProduction.textContent = show(machine.producao, "un.");
    if (dom.hmiCycles) dom.hmiCycles.textContent = show(machine.ciclos, "ciclos");
    if (dom.hmiTemp) dom.hmiTemp.textContent = show(machine.temperatura, "°C");
    if (dom.hmiVibration) dom.hmiVibration.textContent = show(machine.vibracao, "mm/s");

    dom.hmiSensorEntry?.classList.toggle("active", sensors.entry === true);
    dom.hmiSensorMiddle?.classList.toggle("active", sensors.middle === true);
    dom.hmiSensorExit?.classList.toggle("active", sensors.exit === true);

    setLamp(dom.hmiInterlockStart, interlocks.startPermitted, "Liberado", "Bloqueado");
    setLamp(dom.hmiInterlockEstop, interlocks.estopOk, "OK", "Acionado / aberto");
    setLamp(dom.hmiInterlockDoor, interlocks.safetyDoorClosed ?? interlocks.guardOk, "Fechada", "Aberta");
    setLamp(dom.hmiAlarm, alarm ? false : true, "Normal", "Alarme ativo");

    document.querySelectorAll("[data-hmi-command]").forEach(button => {
      const command = button.dataset.hmiCommand;
      let disabled = commandBusy;
      if (command === "IHM_START") disabled ||= !startAllowed || running || alarm;
      if (command === "IHM_STOP") disabled ||= !remoteEnabled || (!simulation && !machine.controlador);
      if (!["IHM_START", "IHM_STOP"].includes(command)) {
        disabled ||= !remoteEnabled || (!simulation && connection !== "CONECTADA");
      }
      button.disabled = disabled;
      if (command === "IHM_MODE_AUTO") button.classList.toggle("active", mode === "AUTO");
      if (command === "IHM_MODE_MANUAL") button.classList.toggle("active", mode === "MANUAL");
    });

    if (dom.hmiCommandState && !commandBusy) {
      dom.hmiCommandState.className = "hmi-command-state";
      const span = dom.hmiCommandState.querySelector("span");
      if (!remoteEnabled) {
        dom.hmiCommandState.classList.add("blocked");
        if (span) span.textContent = "Controle remoto real desativado no cadastro desta máquina.";
      } else if (alarm) {
        dom.hmiCommandState.classList.add("blocked");
        if (span) span.textContent = "START bloqueado por condição de segurança. RESET não libera a parada de segurança.";
      } else if (!simulation && connection !== "CONECTADA") {
        dom.hmiCommandState.classList.add("blocked");
        if (span) span.textContent = "Sem telemetria recente. START, RESET e troca de modo permanecem bloqueados.";
      } else if (!simulation && diagnostic.hmi?.startPolicy?.permitido !== true) {
        dom.hmiCommandState.classList.add("blocked");
        if (span) span.textContent = diagnostic.hmi?.startPolicy?.motivo || "Aguardando confirmação dos intertravamentos físicos.";
      } else {
        dom.hmiCommandState.classList.add("ok");
        if (span) span.textContent = simulation ? "IHM em simulação funcional. Os comandos alteram o processo demonstrado." : "IHM real habilitada. Comandos passam pela fila autenticada com ACK e prazo de validade.";
      }
    }
  }

  function render() {
    if (!machine || !diagnostic) return;
    const code = String(machine.controlador || "").toUpperCase();
    const profile = profiles[code];
    if (!profile) return;

    const extras = diagnostic.dadosExtras || machine.dadosExtrasAtuais || {};
    const hasReading = Boolean(diagnostic.ultimaTelemetriaEm) || diagnostic.modoSimulacao === true;
    dom.root?.style.setProperty("--controller-accent", profile.accent);
    dom.root?.style.setProperty("--controller-dark", profile.dark);
    if (dom.icon) dom.icon.className = `fa-solid ${profile.icon}`;
    if (dom.eyebrow) dom.eyebrow.textContent = `PAINEL ${profile.panel.toUpperCase()}`;
    if (dom.title) dom.title.textContent = machine.nome || profile.panel;
    if (dom.description) dom.description.textContent = profile.description;

    const stateCode = String(diagnostic.estadoConexao?.codigo || "OFFLINE").toUpperCase();
    const online = stateCode === "CONECTADA";
    const unstable = stateCode === "INSTAVEL";
    const simulation = stateCode === "SIMULACAO" || diagnostic.modoSimulacao === true;
    if (dom.state) {
      dom.state.className = `controller-state ${online || simulation ? "online" : unstable ? "unstable" : "offline"}`;
      const strong = dom.state.querySelector("strong");
      if (strong) strong.textContent = simulation ? "Simulação ativa" : online ? "Controlador conectado" : unstable ? "Conexão instável" : "Aguardando telemetria";
    }

    if (dom.protocol) dom.protocol.textContent = formatProtocol(diagnostic.protocolo);
    if (dom.latency) dom.latency.textContent = simulation ? "0 ms" : show(diagnostic.latenciaMs, "ms");
    if (dom.signal) dom.signal.textContent = simulation ? "100 %" : show(diagnostic.qualidadeSinal, "%");
    if (dom.lastReading) dom.lastReading.textContent = simulation ? "Simulação local" : formatDate(diagnostic.ultimaTelemetriaEm);

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
      ["Origem da leitura", simulation ? "SIMULADOR" : diagnostic.origemUltimaLeitura || "Sem leitura"], ["Comandos pendentes", diagnostic.comandosPendentes ?? 0]
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

    renderHmi(extras);
  }

  async function load() {
    const sequence = ++loadSequence;
    try {
      const [machineResponse, diagnosticResponse] = await Promise.all([
        fetchAuth(`${API}/maquinas/${machineId}`), fetchAuth(`${API}/maquinas/${machineId}/diagnostico`)
      ]);
      if (!machineResponse.ok || !diagnosticResponse.ok) throw new Error("Não foi possível carregar o controlador.");
      const [nextMachine, nextDiagnostic] = await Promise.all([machineResponse.json(), diagnosticResponse.json()]);
      // Descarta respostas antigas que chegaram depois de uma atualização mais nova.
      if (sequence !== loadSequence) return;
      machine = nextMachine;
      diagnostic = nextDiagnostic;
      openDedicatedView();
      render();
    } catch (error) {
      if (sequence !== loadSequence) return;
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Painel do controlador", mensagem: error.message });
    }
  }

  async function sendHmiCommand(command) {
    if (commandBusy) return;
    commandBusy = true;
    if (dom.hmiCommandState) {
      dom.hmiCommandState.className = "hmi-command-state";
      const span = dom.hmiCommandState.querySelector("span");
      if (span) span.textContent = `Enviando ${command.replace("IHM_", "")}...`;
    }
    render();
    try {
      const response = await fetchAuth(`${API}/maquinas/${machineId}/ihm/comandos`, {
        method: "POST",
        body: JSON.stringify({ comando: command })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.mensagem || "Comando não autorizado pela IHM.");
      if (data.maquina) {
        machine = { ...(machine || {}), ...data.maquina };
        // O backend devolve o estado persistido imediatamente na simulação.
        // Refletimos AUTO/MANUAL sem esperar o próximo polling.
        const persistedHmi = data.maquina?.integracaoMeta?.hmi;
        if (diagnostic?.modoSimulacao === true && persistedHmi && typeof persistedHmi === "object") {
          diagnostic = {
            ...(diagnostic || {}),
            hmi: { ...(diagnostic?.hmi || {}), ...persistedHmi }
          };
        }
        render();
      }
      await load();
      window.SteelUI?.toast?.({ tipo: "success", titulo: "IHM industrial", mensagem: data.mensagem || "Comando processado." });
    } catch (error) {
      if (dom.hmiCommandState) {
        dom.hmiCommandState.className = "hmi-command-state error";
        const span = dom.hmiCommandState.querySelector("span");
        if (span) span.textContent = error.message;
      }
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Comando bloqueado", mensagem: error.message });
    } finally {
      commandBusy = false;
      render();
    }
  }

  document.querySelectorAll("[data-hmi-command]").forEach(button => {
    button.addEventListener("click", () => sendHmiCommand(button.dataset.hmiCommand));
  });

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
