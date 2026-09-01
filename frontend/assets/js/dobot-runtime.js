(() => {
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  const machineId = localStorage.getItem("maquinaId");
  if (!token || !machineId) return;

  const $ = id => document.getElementById(id);
  const requestedView = new URLSearchParams(window.location.search).get("view");
  const dom = {
    name: $("dobotMachineName"), badge: $("dobotStateBadge"),
    gateway: $("dobotGatewayState"), port: $("dobotPort"),
    latency: $("dobotLatency"), alarms: $("dobotAlarmsCount"),
    x: $("dobotX"), y: $("dobotY"), z: $("dobotZ"), r: $("dobotR"),
    j1: $("dobotJ1"), j2: $("dobotJ2"), j3: $("dobotJ3"), j4: $("dobotJ4"),
    temp: $("dobotSensorTemp"), vib: $("dobotSensorVibration"),
    current: $("dobotSensorCurrent"), suction: $("dobotSuction"),
    gripper: $("dobotGripper"), queue: $("dobotQueue"), mode: $("dobotMode"),
    lock: $("dobotMotionLock"), ptp: $("dobotPtpForm")
  };

  let machine = null;
  let diagnostic = null;
  let lastExtras = null;
  let requestedViewHandled = false;

  async function fetchAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(url, { ...options, headers });
  }

  const n = (value, decimals = 1) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : "--";

  const isDobot = () =>
    String(machine?.controlador || diagnostic?.controlador || "").toUpperCase() ===
    "DOBOT_MAGICIAN";

  function sensor(state, value, unit) {
    if (state === "MOCK" && Number.isFinite(Number(value))) {
      return `${n(value, 2)} ${unit} • MOCK`;
    }
    if (state === "REAL" && Number.isFinite(Number(value))) {
      return `${n(value, 2)} ${unit}`;
    }
    return "Não instalado";
  }

  function openDedicatedView() {
    if (requestedView !== "dobot" || requestedViewHandled || !machine) return;
    requestedViewHandled = true;

    if (!isDobot()) {
      window.SteelUI?.toast?.({
        tipo: "warning",
        titulo: "Painel exclusivo do Dobot",
        mensagem: "Cadastre ou selecione uma máquina com o controlador Dobot Magician."
      });
      window.setTimeout(() => window.location.replace("maquinas.html"), 900);
      return;
    }

    window.mostrarTela?.("dobot", null);
  }

  function render(extras) {
    if (extras) lastExtras = extras;
    if (!isDobot()) return;

    const data = lastExtras?.dobot || {};
    const online = Boolean(data.connected);
    if (dom.name) dom.name.textContent = machine?.nome || "Dobot Magician";
    if (dom.badge) {
      dom.badge.className = `dobot-state ${online ? "online" : "waiting"}`;
      dom.badge.querySelector("strong").textContent = online
        ? `Dobot ${data.mode || ""} conectado`
        : "Aguardando gateway";
    }
    if (dom.gateway) dom.gateway.textContent = online ? "Online" : "Aguardando";
    if (dom.port) dom.port.textContent = data.port || diagnostic?.integracaoMeta?.dobot?.port || "AUTO";
    if (dom.latency) dom.latency.textContent = diagnostic?.latenciaMs == null ? "--" : `${diagnostic.latenciaMs} ms`;
    if (dom.alarms) dom.alarms.textContent = Array.isArray(data.alarms) ? String(data.alarms.length) : "--";

    for (const [key, element] of [["x", dom.x], ["y", dom.y], ["z", dom.z], ["r", dom.r]]) {
      if (element) element.textContent = n(data.pose?.[key], 2);
    }
    for (const [key, element] of [["j1", dom.j1], ["j2", dom.j2], ["j3", dom.j3], ["j4", dom.j4]]) {
      if (element) element.textContent = n(data.joints?.[key], 2);
    }

    if (dom.mode) dom.mode.textContent = data.mode || diagnostic?.integracaoMeta?.dobot?.mode || "--";
    if (dom.queue) dom.queue.textContent = data.queue || "--";
    if (dom.suction) dom.suction.textContent = data.endEffector?.suction === true ? "Ligada" : data.endEffector?.suction === false ? "Desligada" : "--";
    if (dom.gripper) dom.gripper.textContent = data.endEffector?.gripper === true ? "Fechada" : data.endEffector?.gripper === false ? "Aberta" : "--";

    const sensors = data.sensors || {};
    if (dom.temp) dom.temp.textContent = sensor(sensors.temperature, machine?.temperatura, "°C");
    if (dom.vib) dom.vib.textContent = sensor(sensors.vibration, machine?.vibracao, "mm/s");
    if (dom.current) dom.current.textContent = sensor(sensors.current, machine?.corrente, "A");

    const prepared = Boolean(diagnostic?.integracaoMeta?.dobot?.allowMotion);
    if (dom.lock) {
      dom.lock.classList.toggle("unlocked", prepared);
      dom.lock.innerHTML = prepared
        ? '<i class="fa-solid fa-shield"></i> Interface preparada'
        : '<i class="fa-solid fa-lock"></i> Movimento protegido';
    }
  }

  async function load() {
    try {
      const [machineResponse, diagnosticResponse] = await Promise.all([
        fetchAuth(`${API}/maquinas/${machineId}`),
        fetchAuth(`${API}/maquinas/${machineId}/diagnostico`)
      ]);
      if (machineResponse.ok) machine = await machineResponse.json();
      if (diagnosticResponse.ok) diagnostic = await diagnosticResponse.json();
      openDedicatedView();
      render(diagnostic?.dadosExtras || machine?.dadosExtrasAtuais || machine?.telemetria?.at(-1)?.dadosExtras || null);
    } catch (_) {}
  }

  async function command(comando, payload = {}) {
    try {
      if (!isDobot()) throw new Error("A máquina selecionada não é um Dobot Magician.");
      const response = await fetchAuth(`${API}/maquinas/${machineId}/comandos`, {
        method: "POST",
        body: JSON.stringify({ comando, payload })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.mensagem || "Comando não aceito.");
      window.SteelUI?.toast?.({ tipo: "success", titulo: "Comando na fila", mensagem: data.mensagem || comando });
    } catch (error) {
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Comando Dobot", mensagem: error.message });
    }
  }

  document.querySelectorAll("[data-dobot-command]").forEach(button =>
    button.addEventListener("click", async () => {
      const commandName = button.dataset.dobotCommand;
      if (commandName !== "DOBOT_STOP") {
        const confirmed = await (window.SteelUI?.confirm?.({
          titulo: "Comando do robô",
          mensagem: `Enviar ${commandName} para a fila do Dobot?\nConfirme que a área do braço está livre no modo REAL.`,
          confirmar: "Enviar",
          perigoso: true
        }) ?? Promise.resolve(confirm("Enviar comando?")));
        if (!confirmed) return;
      }
      command(commandName);
    })
  );

  dom.ptp?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(dom.ptp);
    const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, Number(value)]));
    const confirmed = await (window.SteelUI?.confirm?.({
      titulo: "Movimento PTP",
      mensagem: `Mover para X ${payload.x} / Y ${payload.y} / Z ${payload.z} / R ${payload.r}?`,
      confirmar: "Enviar PTP",
      perigoso: true
    }) ?? Promise.resolve(confirm("Enviar movimento?")));
    if (confirmed) command("DOBOT_PTP", payload);
  });

  window.addEventListener("steelcontrol:machine-diagnostic", event => {
    diagnostic = { ...(diagnostic || {}), ...(event.detail || {}) };
    render(diagnostic?.dadosExtras);
  });
  window.addEventListener("steelcontrol:machine-snapshot", event => {
    machine = { ...(machine || {}), ...(event.detail || {}) };
    openDedicatedView();
    render(event.detail?.dadosExtras);
  });

  load();
  setInterval(load, 10000);
})();
