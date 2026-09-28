(() => {
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  const machineId = localStorage.getItem("maquinaId");
  if (localStorage.getItem("autenticado") !== "true" || !machineId) return;

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
    lock: $("dobotMotionLock"),
    jogStep: $("dobotJogStep"), jogSpeed: $("dobotJogSpeed"),
    jogSpeedValue: $("dobotJogSpeedValue"), jogTarget: $("dobotJogTarget"),
    manualMode: $("dobotManualMode"), automaticMode: $("dobotAutomaticMode"),
    manualPane: $("dobotManualControls"), automaticPane: $("dobotAutomaticControls"),
    interlock: $("dobotCycleInterlock"), autoStatus: $("dobotAutoStatus"),
    autoCycles: $("dobotAutoCycles"), autoSpeed: $("dobotAutoSpeed"),
    autoStep: $("dobotAutoStep"), autoCounter: $("dobotAutoCounter"),
    autoProgress: $("dobotAutoProgress"), autoStart: $("dobotAutoStart"),
    autoPause: $("dobotAutoPause"), autoStop: $("dobotAutoStop"),
    autoReset: $("dobotAutoReset")
  };

  const POINTS = ["P0", "P1", "P2", "P3", "P4"];
  const POINT_LABELS = { P0: "Espera", P1: "Acima da peça", P2: "Coleta", P3: "Acima do destino", P4: "Entrega" };
  const storageKey = `steelcontrol:dobot:auto-points:${machineId}`;

  let machine = null;
  let diagnostic = null;
  let lastExtras = null;
  let requestedViewHandled = false;
  let taughtPoints = loadTaughtPoints();
  let automatic = { running: false, paused: false, stopRequested: false, completed: 0, total: 1 };
  let jogBusy = false;
  let connectionOnline = false;

  async function fetchAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.set("Cache-Control", "no-cache");
    return fetch(url, { ...options, headers, cache: "no-store" });
  }

  const n = (value, decimals = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : "--";
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isDobot = () => String(machine?.controlador || diagnostic?.controlador || "").toUpperCase() === "DOBOT_MAGICIAN";

  function hasFreshRealConnection(data) {
    const connectionCode = String(
      diagnostic?.estadoConexao?.codigo || machine?.estadoConexao?.codigo || machine?.statusConexao || "OFFLINE"
    ).trim().toUpperCase();
    const realEquipment = diagnostic?.modoSimulacao === false || machine?.modoSimulacao === false;
    return realEquipment && connectionCode === "CONECTADA" && data?.connected === true;
  }

  function setControlsAvailability(online) {
    connectionOnline = online;
    document.querySelectorAll("[data-dobot-command], [data-dobot-jog], [data-dobot-capture]").forEach(button => {
      const manualLocked = automatic.running && !button.matches('[data-dobot-command="DOBOT_STOP"]');
      const jogLocked = button.matches("[data-dobot-jog]") && jogBusy;
      button.disabled = !online || manualLocked || jogLocked;
    });
    if (dom.jogStep) dom.jogStep.disabled = !online || jogBusy;
    if (dom.jogSpeed) dom.jogSpeed.disabled = !online || jogBusy;
    if (dom.automaticMode) dom.automaticMode.disabled = !online;
    if (dom.autoStart) dom.autoStart.disabled = !online || automatic.running || POINTS.some(point => !taughtPoints[point]);
  }

  function sensor(state, value, unit) {
    if (state === "MOCK" && Number.isFinite(Number(value))) return `${n(value, 2)} ${unit} • MOCK`;
    if (state === "REAL" && Number.isFinite(Number(value))) return `${n(value, 2)} ${unit}`;
    return "Não instalado";
  }

  function openDedicatedView() {
    if (requestedView !== "dobot" || requestedViewHandled || !machine) return;
    requestedViewHandled = true;
    if (!isDobot()) {
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Painel exclusivo do Dobot", mensagem: "Cadastre ou selecione uma máquina com o controlador Dobot Magician." });
      window.setTimeout(() => window.location.replace("/app/maquinas"), 900);
      return;
    }
    window.mostrarTela?.("dobot", null);
  }

  function currentPose() {
    const pose = lastExtras?.dobot?.pose || lastExtras?.pose || {};
    const normalized = {};
    for (const key of ["x", "y", "z", "r"]) {
      const value = Number(pose?.[key] ?? pose?.[key.toUpperCase()]);
      if (!Number.isFinite(value)) return null;
      normalized[key] = value;
    }
    return normalized;
  }

  function poseDistance(a, b) {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z, (a.r - b.r) / 2);
  }

  function duplicatedPoint(point, pose) {
    return POINTS.find(other => other !== point && taughtPoints[other] && poseDistance(taughtPoints[other], pose) < 3);
  }

  function duplicatedPairs() {
    const pairs = [];
    for (let index = 0; index < POINTS.length; index += 1) {
      for (let next = index + 1; next < POINTS.length; next += 1) {
        const first = POINTS[index];
        const second = POINTS[next];
        if (taughtPoints[first] && taughtPoints[second] && poseDistance(taughtPoints[first], taughtPoints[second]) < 3) pairs.push(`${first}/${second}`);
      }
    }
    return pairs;
  }

  function loadTaughtPoints() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (!value || typeof value !== "object") return {};
      const sanitized = {};
      for (const point of POINTS) {
        const pose = value[point];
        if (!pose || !["x", "y", "z", "r"].every(key => Number.isFinite(Number(pose[key])))) continue;
        const normalized = Object.fromEntries(["x", "y", "z", "r"].map(key => [key, Number(pose[key])]));
        if (Object.values(sanitized).some(saved => poseDistance(saved, normalized) < 3)) continue;
        sanitized[point] = normalized;
      }
      if (JSON.stringify(sanitized) !== JSON.stringify(value)) localStorage.setItem(storageKey, JSON.stringify(sanitized));
      return sanitized;
    } catch (_) { return {}; }
  }

  function saveTaughtPoints() {
    localStorage.setItem(storageKey, JSON.stringify(taughtPoints));
    renderTaughtPoints();
  }

  function renderTaughtPoints() {
    for (const point of POINTS) {
      const value = taughtPoints[point];
      const article = document.querySelector(`[data-dobot-point="${point}"]`);
      const output = document.querySelector(`[data-dobot-point-value="${point}"]`);
      article?.classList.toggle("taught", Boolean(value));
      if (output) output.textContent = value ? `X ${n(value.x, 1)} • Y ${n(value.y, 1)} • Z ${n(value.z, 1)} • R ${n(value.r, 1)}` : "Não ensinado";
    }
    const missing = POINTS.filter(point => !taughtPoints[point]);
    const duplicates = duplicatedPairs();
    if (dom.autoStart) dom.autoStart.disabled = !connectionOnline || automatic.running || missing.length > 0 || duplicates.length > 0;
    if (!automatic.running && missing.length && dom.autoStatus) {
      dom.autoStatus.textContent = `Ensine ${missing.join(", ")}`;
    } else if (!automatic.running && duplicates.length && dom.autoStatus) {
      dom.autoStatus.textContent = `Recapture ${duplicates.join(", ")}`;
    } else if (!automatic.running && !missing.length && dom.autoStatus && /Pronto para ensinar|Ensine P|Recapture/.test(dom.autoStatus.textContent || "")) {
      dom.autoStatus.textContent = "Pronto para iniciar";
    }
  }

  function setControlMode(mode) {
    const automaticMode = mode === "automatic";
    dom.manualMode?.classList.toggle("active", !automaticMode);
    dom.automaticMode?.classList.toggle("active", automaticMode);
    if (dom.manualPane) dom.manualPane.hidden = automaticMode;
    if (dom.automaticPane) dom.automaticPane.hidden = !automaticMode;
  }

  function updateAutoUi({ status, step, progress } = {}) {
    if (status && dom.autoStatus) dom.autoStatus.textContent = status;
    if (step && dom.autoStep) dom.autoStep.textContent = step;
    if (Number.isFinite(progress) && dom.autoProgress) dom.autoProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    if (dom.autoCounter) dom.autoCounter.textContent = `${automatic.completed} / ${automatic.total}`;
    if (dom.autoStart) dom.autoStart.disabled = !connectionOnline || automatic.running || POINTS.some(point => !taughtPoints[point]) || duplicatedPairs().length > 0;
    if (dom.autoPause) {
      dom.autoPause.disabled = !automatic.running;
      dom.autoPause.innerHTML = automatic.paused ? '<i class="fa-solid fa-play"></i> CONTINUAR' : '<i class="fa-solid fa-pause"></i> PAUSAR';
    }
    if (dom.autoStop) dom.autoStop.disabled = !automatic.running;
    if (dom.autoReset) dom.autoReset.disabled = automatic.running;
    document.querySelectorAll("[data-dobot-capture]").forEach(button => { button.disabled = automatic.running; });
    if (dom.autoCycles) dom.autoCycles.disabled = automatic.running;
    if (dom.autoSpeed) dom.autoSpeed.disabled = automatic.running;
    if (dom.interlock) {
      dom.interlock.classList.toggle("running", automatic.running && !automatic.paused);
      dom.interlock.classList.toggle("paused", automatic.running && automatic.paused);
      dom.interlock.innerHTML = automatic.running
        ? automatic.paused
          ? '<i class="fa-solid fa-pause"></i> Automático pausado'
          : '<i class="fa-solid fa-lock"></i> Manual intertravado'
        : '<i class="fa-solid fa-circle-check"></i> Manual liberado';
    }
  }

  function render(extras) {
    if (extras) lastExtras = extras;
    if (!isDobot()) return;
    const data = lastExtras?.dobot || {};
    const online = hasFreshRealConnection(data);
    setControlsAvailability(online);
    if (dom.name) dom.name.textContent = machine?.nome || "Dobot Magician";
    if (dom.badge) {
      dom.badge.className = `dobot-state ${online ? "online" : "waiting"}`;
      dom.badge.querySelector("strong").textContent = online ? `Dobot ${data.mode || "REAL"} conectado` : "Aguardando conexão real";
    }
    if (dom.gateway) dom.gateway.textContent = online ? "Online" : "Offline";
    if (dom.port) dom.port.textContent = online ? data.port || diagnostic?.integracaoMeta?.dobot?.port || "AUTO" : "--";
    if (dom.latency) dom.latency.textContent = online && diagnostic?.latenciaMs != null ? `${diagnostic.latenciaMs} ms` : "--";
    if (dom.alarms) dom.alarms.textContent = online && Array.isArray(data.alarms) ? String(data.alarms.length) : "--";
    for (const [key, element] of [["x", dom.x], ["y", dom.y], ["z", dom.z], ["r", dom.r]]) if (element) element.textContent = online ? n(data.pose?.[key], 2) : "--";
    for (const [key, element] of [["j1", dom.j1], ["j2", dom.j2], ["j3", dom.j3], ["j4", dom.j4]]) if (element) element.textContent = online ? n(data.joints?.[key], 2) : "--";
    if (dom.mode) dom.mode.textContent = online ? data.mode || diagnostic?.integracaoMeta?.dobot?.mode || "--" : "--";
    if (dom.queue) dom.queue.textContent = online ? data.queue || "--" : "--";
    if (dom.suction) dom.suction.textContent = online && data.endEffector?.suction === true ? "Ligada" : online && data.endEffector?.suction === false ? "Desligada" : "--";
    if (dom.gripper) dom.gripper.textContent = online && data.endEffector?.gripper === true ? "Fechada" : online && data.endEffector?.gripper === false ? "Aberta" : "--";
    const sensors = data.sensors || {};
    if (dom.temp) dom.temp.textContent = sensor(sensors.temperature, machine?.temperatura, "°C");
    if (dom.vib) dom.vib.textContent = sensor(sensors.vibration, machine?.vibracao, "mm/s");
    if (dom.current) dom.current.textContent = sensor(sensors.current, machine?.corrente, "A");
    const prepared = online && isDobot();
    if (dom.lock) {
      dom.lock.classList.toggle("unlocked", prepared);
      dom.lock.innerHTML = prepared ? '<i class="fa-solid fa-shield"></i> Comandos autenticados' : '<i class="fa-solid fa-lock"></i> Aguardando Dobot';
    }
  }

  async function load() {
    try {
      const [machineResponse, diagnosticResponse] = await Promise.all([
        fetchAuth(`${API}/maquinas/${machineId}`), fetchAuth(`${API}/maquinas/${machineId}/diagnostico`)
      ]);
      if (machineResponse.ok) machine = await machineResponse.json();
      if (diagnosticResponse.ok) diagnostic = await diagnosticResponse.json();
      openDedicatedView();
      render(diagnostic?.dadosExtras || machine?.dadosExtrasAtuais || machine?.telemetria?.at?.(-1)?.dadosExtras || null);
    } catch (_) {}
  }

  async function sendCommand(comando, payload = {}, { silent = false } = {}) {
    if (!isDobot()) throw new Error("A máquina selecionada não é um Dobot Magician.");
    if (!connectionOnline) throw new Error("Dobot offline. Aguarde uma conexão real e telemetria recente antes de enviar comandos.");
    const response = await fetchAuth(`${API}/maquinas/${machineId}/comandos`, { method: "POST", body: JSON.stringify({ comando, payload }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.mensagem || "Comando não aceito.");
    if (!silent) window.SteelUI?.toast?.({ tipo: "success", titulo: "Comando na fila", mensagem: data.mensagem || comando });
    return data;
  }

  async function waitCommandCompletion(commandId, timeoutMs = 35000) {
    if (!Number.isFinite(Number(commandId))) throw new Error("O backend não retornou o identificador do comando.");
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (automatic.stopRequested) throw new Error("Ciclo interrompido pelo operador.");
      const response = await fetchAuth(`${API}/maquinas/${machineId}/comandos/${commandId}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.mensagem || "Não foi possível acompanhar o comando do Dobot.");
      const status = String(data.status || "").toUpperCase();
      if (status === "CONCLUIDO") return data;
      if (["FALHOU", "CANCELADO", "EXPIRADO"].includes(status)) {
        throw new Error(`O Edge informou ${status.toLowerCase()} para ${data.comando || "o comando"}. Consulte Diagnóstico / logs.`);
      }
      await delay(250);
    }
    throw new Error("O Edge não confirmou a execução do comando dentro do tempo esperado.");
  }

  async function manualCommand(comando, payload = {}, { silent = false } = {}) {
    try {
      const queued = await sendCommand(comando, payload, { silent });
      await waitCommandCompletion(queued?.comando?.id, comando === "DOBOT_HOME" || comando === "DOBOT_PTP" ? 20000 : 12000);
      if (!silent) window.SteelUI?.toast?.({ tipo: "success", titulo: "Comando executado", mensagem: comando });
      return queued;
    }
    catch (error) {
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Comando Dobot", mensagem: error.message });
      return null;
    }
  }

  async function refreshDiagnosticPose() {
    const response = await fetchAuth(`${API}/maquinas/${machineId}/diagnostico`);
    if (!response.ok) throw new Error("Sem telemetria do Dobot durante o ciclo.");
    diagnostic = await response.json();
    if (diagnostic?.dadosExtras) {
      lastExtras = diagnostic.dadosExtras;
      render(lastExtras);
    }
    return currentPose();
  }

  function setJogBusy(busy, message) {
    jogBusy = busy;
    document.querySelectorAll("[data-dobot-jog]").forEach(button => { button.disabled = !connectionOnline || busy; });
    if (dom.jogStep) dom.jogStep.disabled = !connectionOnline || busy;
    if (dom.jogSpeed) dom.jogSpeed.disabled = !connectionOnline || busy;
    if (dom.jogTarget && message) dom.jogTarget.textContent = message;
  }

  async function jog(direction) {
    if (automatic.running) {
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Manual intertravado", mensagem: "O ciclo automático ainda está parando." });
      return;
    }
    if (jogBusy) return;
    const step = Math.max(1, Math.min(20, Number(dom.jogStep?.value) || 5));
    const speed = Math.max(1, Math.min(40, Number(dom.jogSpeed?.value) || 20));
    const delta = {
      "x+": { x: step }, "x-": { x: -step },
      "y+": { y: step }, "y-": { y: -step },
      "z+": { z: step }, "z-": { z: -step },
      "r+": { r: step }, "r-": { r: -step }
    }[direction];
    if (!delta) return;
    try {
      setJogBusy(true, `Lendo posição real • ${direction.toUpperCase()}`);
      const pose = await refreshDiagnosticPose();
      if (!pose) throw new Error("A posição real do Dobot não está disponível.");
      const target = {
        x: pose.x + (delta.x || 0), y: pose.y + (delta.y || 0),
        z: pose.z + (delta.z || 0), r: pose.r + (delta.r || 0), velocidade: speed
      };
      setJogBusy(true, `${direction.toUpperCase()} • ${step}${direction.startsWith("r") ? "°" : " mm"}`);
      const executed = await manualCommand("DOBOT_PTP", target, { silent: true });
      if (executed) {
        await refreshDiagnosticPose();
        setJogBusy(false, `Posição confirmada • X ${n(target.x, 1)}  Y ${n(target.y, 1)}  Z ${n(target.z, 1)}  R ${n(target.r, 1)}`);
      } else setJogBusy(false, "Movimento não executado");
    } catch (error) {
      setJogBusy(false, "Falha no movimento");
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Controle jog", mensagem: error.message });
    }
  }

  function reachedTarget(actual, target) {
    if (!actual || !target) return false;
    return Math.abs(actual.x - target.x) <= 3 && Math.abs(actual.y - target.y) <= 3 && Math.abs(actual.z - target.z) <= 3 && Math.abs(actual.r - target.r) <= 4;
  }

  async function waitWhilePaused() {
    while (automatic.running && automatic.paused && !automatic.stopRequested) await delay(120);
    if (automatic.stopRequested) throw new Error("Ciclo interrompido pelo operador.");
  }

  async function waitMotion(target) {
    const deadline = Date.now() + 18000;
    while (Date.now() < deadline) {
      if (automatic.stopRequested) throw new Error("Ciclo interrompido pelo operador.");
      const actual = await refreshDiagnosticPose();
      if (reachedTarget(actual, target)) return;
      await delay(120);
    }
    throw new Error("O Dobot não confirmou a posição de destino dentro do tempo esperado.");
  }

  async function moveAutomatic(point, speed) {
    const target = taughtPoints[point];
    if (!target) throw new Error(`${point} ainda não foi ensinado.`);
    await waitWhilePaused();
    const queued = await sendCommand("DOBOT_PTP", { ...target, velocidade: speed }, { silent: true });
    await waitCommandCompletion(queued?.comando?.id, 40000);
    // O ACK pode chegar alguns milissegundos antes da telemetria com a nova pose.
    // Aguarda a pose real em vez de rejeitar o ciclo usando a leitura anterior.
    await waitMotion(target);
  }

  async function automaticCommand(command) {
    await waitWhilePaused();
    const queued = await sendCommand(command, {}, { silent: true });
    await waitCommandCompletion(queued?.comando?.id, 20000);
    // Tempo curto para a peça aderir/soltar antes do próximo deslocamento.
    await delay(250);
  }

  async function capturePoint(point) {
    try {
      if (automatic.running) throw new Error("Pare o ciclo antes de ensinar posições.");
      // A pose exibida pode ser de uma telemetria anterior. Sempre consulta o
      // backend novamente antes de gravar um ponto de ensino.
      await delay(320);
      const pose = await refreshDiagnosticPose();
      if (!pose) throw new Error("A posição atual do Dobot ainda não está disponível.");
      const duplicate = duplicatedPoint(point, pose);
      if (duplicate) throw new Error(`${point} está praticamente igual a ${duplicate}. Mova fisicamente o braço e capture novamente.`);
      taughtPoints[point] = { ...pose };
      saveTaughtPoints();
      updateAutoUi({ status: `${point} • ${POINT_LABELS[point]} ensinado` });
      window.SteelUI?.toast?.({ tipo: "success", titulo: `${point} capturado`, mensagem: `X ${n(pose.x, 1)} / Y ${n(pose.y, 1)} / Z ${n(pose.z, 1)} / R ${n(pose.r, 1)}` });
    } catch (error) {
      window.SteelUI?.toast?.({ tipo: "error", titulo: "Ensino do ciclo", mensagem: error.message });
    }
  }

  const cycleSteps = [
    { label: "Aguardar na posição segura", action: (speed) => moveAutomatic("P0", speed) },
    { label: "Aproximar da matéria-prima", action: (speed) => moveAutomatic("P1", speed) },
    { label: "Coletar componente", action: (speed) => moveAutomatic("P2", speed) },
    { label: "Fixar componente • Ventosa ON", action: () => automaticCommand("DOBOT_SUCTION_ON") },
    { label: "Elevar componente", action: (speed) => moveAutomatic("P1", speed) },
    { label: "Transportar para montagem", action: (speed) => moveAutomatic("P3", speed) },
    { label: "Posicionar produto", action: (speed) => moveAutomatic("P4", speed) },
    { label: "Liberar produto • Ventosa OFF", action: () => automaticCommand("DOBOT_SUCTION_OFF") },
    { label: "Recuar da estação", action: (speed) => moveAutomatic("P3", speed) },
    { label: "Retornar à espera", action: (speed) => moveAutomatic("P0", speed) }
  ];

  async function startAutomatic() {
    if (automatic.running) return;
    const missing = POINTS.filter(point => !taughtPoints[point]);
    if (missing.length) {
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Ensine os pontos", mensagem: `Faltam: ${missing.join(", ")}. Posicione o robô e use Capturar atual.` });
      return;
    }
    const duplicates = duplicatedPairs();
    if (duplicates.length) {
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Pontos repetidos", mensagem: `${duplicates.join(", ")} possuem a mesma posição. Mova o braço e capture novamente antes de iniciar.` });
      return;
    }
    const total = Math.max(1, Math.min(20, Number(dom.autoCycles?.value) || 1));
    const speed = Math.max(1, Math.min(40, Number(dom.autoSpeed?.value) || 15));
    automatic = { running: true, paused: false, stopRequested: false, completed: 0, total };
    setControlMode("automatic");
    updateAutoUi({ status: "Ciclo em execução", step: "Preparando sequência", progress: 0 });
    try {
      for (let cycle = 0; cycle < total; cycle += 1) {
        for (let index = 0; index < cycleSteps.length; index += 1) {
          if (automatic.stopRequested) throw new Error("Ciclo interrompido pelo operador.");
          await waitWhilePaused();
          const step = cycleSteps[index];
          const overallIndex = cycle * cycleSteps.length + index;
          const progress = (overallIndex / (total * cycleSteps.length)) * 100;
          updateAutoUi({ status: `Ciclo ${cycle + 1} de ${total}`, step: step.label, progress });
          await step.action(speed);
        }
        automatic.completed = cycle + 1;
        updateAutoUi({ status: `Ciclo ${automatic.completed} concluído`, step: "Peça posicionada", progress: (automatic.completed / total) * 100 });
      }
      window.SteelUI?.toast?.({ tipo: "success", titulo: "Automático concluído", mensagem: `${automatic.completed} ciclo(s) executado(s) com sucesso.` });
      updateAutoUi({ status: "Sequência concluída", step: "Pronto para novo ciclo", progress: 100 });
    } catch (error) {
      if (!automatic.stopRequested) {
        try { await sendCommand("DOBOT_STOP", {}, { silent: true }); } catch (_) {}
        window.SteelUI?.toast?.({ tipo: "error", titulo: "Ciclo automático interrompido", mensagem: error.message });
        updateAutoUi({ status: "Ciclo interrompido", step: error.message });
      } else {
        updateAutoUi({ status: "Parado pelo operador", step: "Movimento interrompido" });
      }
    } finally {
      automatic.running = false;
      automatic.paused = false;
      automatic.stopRequested = false;
      updateAutoUi();
    }
  }

  async function stopAutomatic() {
    if (!automatic.running) return;
    automatic.stopRequested = true;
    automatic.paused = false;
    updateAutoUi({ status: "Parando", step: "Enviando DOBOT_STOP" });
    try { await sendCommand("DOBOT_STOP", {}, { silent: true }); } catch (error) {
      window.SteelUI?.toast?.({ tipo: "error", titulo: "PARAR", mensagem: error.message });
    }
  }

  function togglePause() {
    if (!automatic.running) return;
    automatic.paused = !automatic.paused;
    updateAutoUi({ status: automatic.paused ? "Pausado após a etapa atual" : "Ciclo retomado", step: automatic.paused ? "Aguardando operador" : "Retomando sequência" });
  }

  document.querySelectorAll("[data-dobot-command]").forEach(button => button.addEventListener("click", async () => {
    const commandName = button.dataset.dobotCommand;
    if (automatic.running && commandName !== "DOBOT_STOP") {
      window.SteelUI?.toast?.({ tipo: "warning", titulo: "Manual intertravado", mensagem: "Pare o ciclo automático antes de enviar comandos manuais." });
      return;
    }
    if (commandName === "DOBOT_STOP" && automatic.running) automatic.stopRequested = true;
    await manualCommand(commandName);
  }));

  document.querySelectorAll("[data-dobot-jog]").forEach(button => button.addEventListener("click", () => jog(button.dataset.dobotJog)));
  dom.jogSpeed?.addEventListener("input", () => { if (dom.jogSpeedValue) dom.jogSpeedValue.textContent = `${dom.jogSpeed.value}%`; });

  dom.manualMode?.addEventListener("click", async () => {
    if (automatic.running) await stopAutomatic();
    setControlMode("manual");
  });
  dom.automaticMode?.addEventListener("click", () => setControlMode("automatic"));
  document.querySelectorAll("[data-dobot-capture]").forEach(button => button.addEventListener("click", () => capturePoint(button.dataset.dobotCapture)));
  dom.autoStart?.addEventListener("click", startAutomatic);
  dom.autoPause?.addEventListener("click", togglePause);
  dom.autoStop?.addEventListener("click", stopAutomatic);
  dom.autoReset?.addEventListener("click", () => {
    if (automatic.running) return;
    taughtPoints = {};
    saveTaughtPoints();
    updateAutoUi({ status: "Pronto para ensinar", step: "Capture P0 a P4 em posições reais diferentes", progress: 0 });
  });
  dom.autoCycles?.addEventListener("input", () => { automatic.total = Math.max(1, Math.min(20, Number(dom.autoCycles.value) || 1)); updateAutoUi(); });

  window.addEventListener("steelcontrol:machine-diagnostic", event => { diagnostic = { ...(diagnostic || {}), ...(event.detail || {}) }; render(diagnostic?.dadosExtras); });
  window.addEventListener("steelcontrol:machine-snapshot", event => { machine = { ...(machine || {}), ...(event.detail || {}) }; openDedicatedView(); render(event.detail?.dadosExtras); });

  renderTaughtPoints();
  updateAutoUi();
  setControlMode("manual");
  load();
  setInterval(load, 2000);
})();
