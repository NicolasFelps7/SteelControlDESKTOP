(() => {
  const $ = id => document.getElementById(id);
  const root = $("printer3dDashboard");
  if (!root) return;
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  let activeMachineId = null;
  let activeCameraUrl = null;

  const dom = {
    subtitle: $("printer3dSubtitle"), state: $("printer3dState"), file: $("printer3dFile"), progressText: $("printer3dProgressText"), progressBar: $("printer3dProgressBar"),
    layer: $("printer3dLayer"), layerDetail: $("printer3dLayerDetail"), elapsed: $("printer3dElapsed"), remainingValue: $("printer3dRemainingValue"), eta: $("printer3dEta"),
    nozzleLabel: $("printer3dNozzleLabel"), nozzle: $("printer3dNozzle"), nozzleTarget: $("printer3dNozzleTarget"), nozzleBar: $("printer3dNozzleBar"),
    bedLabel: $("printer3dBedLabel"), bed: $("printer3dBed"), bedTarget: $("printer3dBedTarget"), bedBar: $("printer3dBedBar"),
    chamberLabel: $("printer3dChamberLabel"), chamber: $("printer3dChamber"), chamberTarget: $("printer3dChamberTarget"), chamberBar: $("printer3dChamberBar"), technology: $("printer3dTechnology"),
    speed: $("printer3dSpeed"), fan: $("printer3dFanValue"), flowLabel: $("printer3dFlowLabel"), flow: $("printer3dFlow"), processLabel: $("printer3dProcessLabel"), processValue: $("printer3dProcessValue"),
    material: $("printer3dMaterial"), materialDetail: $("printer3dMaterialDetail"), materialRemaining: $("printer3dMaterialRemaining"),
    axisX: $("printer3dAxisX"), axisY: $("printer3dAxisY"), axisZ: $("printer3dAxisZ"), axisE: $("printer3dAxisE"),
    ecosystem: $("printer3dEcosystem"), source: $("printer3dSource"), firmware: $("printer3dFirmware"), host: $("printer3dHost"), lastUpdate: $("printer3dLastUpdate"),
    machineVisual: $("printer3dMachineVisual"), machineState: $("printer3dMachineState"), modeLabel: $("printer3dModeLabel"), safetyPanel: $("printer3dSafetyPanel"), safetyState: $("printer3dSafetyState"), alarm: $("printer3dAlarm"),
    trendNozzle: $("printer3dTrendNozzle"), trendBed: $("printer3dTrendBed"), trendChamber: $("printer3dTrendChamber"), trendMax: $("printer3dTrendMax"), trendMin: $("printer3dTrendMin"),
    cameraState: $("printer3dCameraState"), cameraImage: $("printer3dCameraImage"), cameraPlaceholder: $("printer3dCameraPlaceholder"), cameraRefresh: $("printer3dCameraRefresh"), cameraOpen: $("printer3dCameraOpen"), controlMode: $("printer3dControlMode"), controlNote: $("printer3dControlNote")
  };

  const first = (...values) => values.find(v => v !== undefined && v !== null && v !== "");
  const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const num = value => { const n = Number(value); return Number.isFinite(n) ? n : null; };
  const pctNumber = value => { const n = num(value); if (n === null) return null; return Math.max(0, Math.min(100, n >= 0 && n <= 1 ? n * 100 : n)); };
  const pct = value => { const n = pctNumber(value); return n === null ? "--" : `${Math.round(n)}%`; };
  const temp = value => { const n = num(value); return n === null ? "--" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} °C`; };
  const axis = value => { const n = num(value); return n === null ? "--" : n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }); };
  const duration = value => {
    const n = num(value); if (n === null || n < 0) return "--";
    const total = Math.round(n), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
  };
  const normalizeState = value => String(value || "Aguardando dados").replace(/_/g, " ").trim();
  const compact = value => value === undefined || value === null || value === "" ? "--" : String(value);

  function technologyMode(value) {
    const text = String(value || "").toLowerCase();
    if (/sla|msla|dlp|resin|resina|lcd/.test(text)) return "resin";
    if (/sls|powder|pó|laser sinter/.test(text)) return "powder";
    if (/fdm|fff|filament|filamento|marlin|klipper/.test(text)) return "fdm";
    return "universal";
  }

  function extract(machine) {
    const extras = obj(machine?.dadosExtrasAtuais || machine?.dadosExtras);
    const p = obj(extras.impressora3d || extras.printer3d || extras.printer);
    const temperatures = obj(p.temperatures || p.temperature);
    const nozzle = obj(p.nozzle || p.extruder || temperatures.nozzle || temperatures.tool0);
    const bed = obj(p.bed || temperatures.bed || p.buildPlate);
    const chamber = obj(p.chamber || p.resin || temperatures.chamber || temperatures.resin);
    const processTemperature = obj(p.processTemperature || p.processTemp || temperatures.process || temperatures.powder);
    const job = obj(p.job || p.print);
    const layer = obj(p.layer || job.layer);
    const motion = obj(p.motion || p.position || p.axes);
    const position = obj(motion.position || motion.axes || motion);
    const process = obj(p.process || p.parameters);
    const materialInfo = obj(p.materialInfo || p.materialData);
    const safety = obj(p.safety || p.interlocks);
    const network = obj(p.network || p.connection);
    const machineInfo = obj(p.machine || p.device);
    const camera = obj(p.camera || p.webcam || p.video);
    const capabilities = obj(p.capabilities || p.features);
    const tech = first(p.technology, p.tecnologia, machine?.integracaoMeta?.impressora3d?.technology, machine?.tipo, "Universal");
    const mode = technologyMode(tech);

    const resinPrimary = first(processTemperature.current, processTemperature.actual, p.resinTemperature, chamber.current, chamber.actual, chamber.temperature);
    const resinPrimaryTarget = first(processTemperature.target, processTemperature.setpoint, p.resinTarget, chamber.target);
    const powderPrimary = first(processTemperature.current, processTemperature.actual, p.powderTemperature, chamber.current);
    const powderTarget = first(processTemperature.target, processTemperature.setpoint, p.powderTarget, chamber.target);

    return {
      mode,
      technology: tech,
      ecosystem: first(p.ecosystem, p.ecossistema, p.platform, p.plataforma, machine?.integracaoMeta?.impressora3d?.ecosystem, machine?.protocolo, "Universal"),
      state: first(p.state, p.status, job.state, job.status, machine?.status, "Aguardando dados"),
      filename: first(p.filename, p.file, job.filename, job.file, "Sem arquivo"),
      progress: first(p.progress, job.progress, extras.progress),
      primaryCurrent: mode === "resin" ? resinPrimary : mode === "powder" ? powderPrimary : first(nozzle.current, nozzle.actual, nozzle.temperature, p.nozzleTemp, p.hotendTemp),
      primaryTarget: mode === "resin" ? resinPrimaryTarget : mode === "powder" ? powderTarget : first(nozzle.target, nozzle.setpoint, p.nozzleTarget, p.hotendTarget),
      bedCurrent: first(bed.current, bed.actual, bed.temperature, p.bedTemp, p.buildPlateTemp),
      bedTarget: first(bed.target, bed.setpoint, p.bedTarget, p.buildPlateTarget),
      chamberCurrent: first(chamber.current, chamber.actual, chamber.temperature, p.chamberTemp, p.ambientTemp),
      chamberTarget: first(chamber.target, chamber.setpoint, p.chamberTarget),
      layerCurrent: first(layer.current, layer.number, p.currentLayer, p.layerCurrent),
      layerTotal: first(layer.total, p.totalLayers, p.layerTotal),
      elapsed: first(p.elapsedSeconds, p.elapsed, job.elapsedSeconds, job.elapsed),
      remaining: first(p.remainingSeconds, p.remaining, job.remainingSeconds, job.remaining),
      speed: first(p.speedPercent, p.speed, job.speedPercent, process.speedPercent),
      fan: first(p.fanPercent, p.fan, job.fanPercent, process.fanPercent),
      flow: first(p.flowPercent, p.flow, process.flowPercent),
      liftSpeed: first(p.liftSpeed, process.liftSpeed),
      powderFeed: first(p.powderFeedPercent, p.powderFeed, process.powderFeedPercent),
      power: first(p.powerPercent, p.power, process.powerPercent, p.heaterPower),
      exposure: first(p.exposureSeconds, p.exposureTime, process.exposureSeconds, process.exposureTime),
      uvPower: first(p.uvPowerPercent, p.uvPower, process.uvPowerPercent),
      laserPower: first(p.laserPowerPercent, p.laserPower, process.laserPowerPercent),
      material: first(typeof p.material === "string" ? p.material : null, p.filament, typeof p.resin === "string" ? p.resin : null, job.material, materialInfo.type, materialInfo.name),
      materialUsed: first(p.materialUsed, p.filamentUsed, p.resinUsed, job.materialUsed, materialInfo.used),
      materialRemaining: first(p.materialRemaining, p.filamentRemaining, p.resinRemaining, materialInfo.remaining, materialInfo.remainingPercent),
      x: first(position.x, p.x, p.axisX), y: first(position.y, p.y, p.axisY), z: first(position.z, p.z, p.axisZ), e: first(position.e, position.extruder, p.e, p.axisE),
      source: first(p.source, p.origin, extras.origem, machine?.protocolo, "Telemetria"),
      firmware: first(p.firmware, machineInfo.firmware, p.firmwareVersion, machineInfo.version),
      host: first(p.host, p.hostname, p.ip, network.host, network.ip, machine?.ip),
      lastUpdate: first(p.timestamp, p.updatedAt, p.lastUpdate, extras.timestamp, machine?.ultimaLeitura, machine?.updatedAt),
      alarm: first(p.alarm, p.error, p.message, safety.alarm, safety.error),
      door: first(p.door, p.doorOpen, safety.door, safety.doorOpen),
      interlock: first(p.interlock, safety.interlock, safety.ok),
      emergency: first(p.emergency, p.emergencyStop, safety.emergency, safety.emergencyStop),
      cameraStream: first(camera.streamUrl, camera.stream, camera.mjpeg, p.cameraStreamUrl, p.streamUrl),
      cameraSnapshot: first(camera.snapshotUrl, camera.snapshot, camera.imageUrl, p.cameraSnapshotUrl, p.snapshotUrl),
      cameraOnline: first(camera.online, camera.connected, p.cameraOnline),
      capabilities,
      remoteControlEnabled: machine?.integracaoMeta?.impressora3d?.remoteControlEnabled === true,
      online: ["CONECTADA", "ONLINE", "CONNECTED"].includes(String(machine?.estadoConexao?.codigo || machine?.statusConexao || "").toUpperCase()) || Boolean(p.online)
    };
  }

  const history = { machineId: null, samples: [] };
  function pushHistory(machine, p) {
    const id = machine?.id ?? machine?.maquinaId ?? machine?.nome ?? "printer";
    if (history.machineId !== id) { history.machineId = id; history.samples = []; }
    const sample = { n: num(p.primaryCurrent), b: num(p.bedCurrent), c: num(p.chamberCurrent) };
    if (sample.n === null && sample.b === null && sample.c === null) return;
    const previous = history.samples[history.samples.length - 1];
    if (!previous || previous.n !== sample.n || previous.b !== sample.b || previous.c !== sample.c) history.samples.push(sample);
    if (history.samples.length > 42) history.samples.shift();
  }

  function drawTrend() {
    const values = history.samples.flatMap(s => [s.n, s.b, s.c]).filter(v => v !== null && Number.isFinite(v));
    if (!values.length) {
      [dom.trendNozzle, dom.trendBed, dom.trendChamber].forEach(el => { if (el) el.setAttribute("points", ""); });
      dom.trendMax.textContent = "-- °C"; dom.trendMin.textContent = "-- °C"; return;
    }
    let min = Math.min(...values), max = Math.max(...values);
    const pad = Math.max(5, (max - min) * .12); min = Math.max(0, min - pad); max += pad;
    if (max - min < 10) max = min + 10;
    const toPoints = key => history.samples.map((sample, index) => {
      const value = sample[key]; if (value === null || !Number.isFinite(value)) return null;
      const x = history.samples.length <= 1 ? 320 : index * (640 / (history.samples.length - 1));
      const y = 155 - ((value - min) / (max - min)) * 140;
      return `${x.toFixed(1)},${Math.max(8, Math.min(162, y)).toFixed(1)}`;
    }).filter(Boolean).join(" ");
    dom.trendNozzle.setAttribute("points", toPoints("n")); dom.trendBed.setAttribute("points", toPoints("b")); dom.trendChamber.setAttribute("points", toPoints("c"));
    dom.trendMax.textContent = `${Math.round(max)} °C`; dom.trendMin.textContent = `${Math.round(min)} °C`;
  }

  function setThermalBar(element, current, target, fallbackMax) {
    if (!element) return;
    const c = num(current), t = num(target);
    if (c === null) { element.style.height = "0%"; return; }
    const max = Math.max(fallbackMax, t !== null ? t * 1.2 : 0, c * 1.08);
    element.style.height = `${Math.max(4, Math.min(100, (c / max) * 100))}%`;
  }

  function formatLastUpdate(value) {
    if (!value) return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return compact(value);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function processDescriptor(p) {
    if (p.mode === "resin") {
      const exposure = num(p.exposure); if (exposure !== null) return { label: "Exposição UV", value: `${exposure.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} s` };
      return { label: "Potência UV", value: pct(p.uvPower) };
    }
    if (p.mode === "powder") return { label: "Potência laser", value: pct(p.laserPower) };
    return { label: "Potência / carga", value: pct(p.power) };
  }

  function flowDescriptor(p) {
    if (p.mode === "resin") return { label: "Elevação / lift", value: num(p.liftSpeed) === null ? "--" : `${num(p.liftSpeed).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm/s` };
    if (p.mode === "powder") return { label: "Alimentação de pó", value: pct(p.powderFeed) };
    return { label: "Fluxo", value: pct(p.flow) };
  }

  function labelsForMode(mode) {
    if (mode === "resin") return { primary: "Resina / processo", bed: "Plataforma", chamber: "Câmara / ambiente", mode: "Resina • SLA/MSLA/DLP" };
    if (mode === "powder") return { primary: "Leito / processo", bed: "Plataforma", chamber: "Câmara", mode: "Pó • SLS" };
    if (mode === "fdm") return { primary: "Bico / extrusor", bed: "Mesa aquecida", chamber: "Câmara", mode: "Filamento • FDM/FFF" };
    return { primary: "Processo térmico", bed: "Plataforma", chamber: "Câmara / material", mode: "Tecnologia universal" };
  }

  function isPrinter(machine) {
    const c = String(machine?.controlador || "").toUpperCase(), type = String(machine?.tipo || "").toUpperCase();
    return c === "IMPRESSORA_3D" || type.includes("IMPRESSORA 3D") || type.includes("3D PRINTER");
  }

  function safeCameraUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function updateCamera(p) {
    const url = safeCameraUrl(p.cameraStream || p.cameraSnapshot);
    activeCameraUrl = url;
    if (dom.cameraOpen) dom.cameraOpen.disabled = !url;
    if (dom.cameraRefresh) dom.cameraRefresh.disabled = !url;
    if (!url) {
      if (dom.cameraImage) { dom.cameraImage.hidden = true; dom.cameraImage.removeAttribute("src"); }
      if (dom.cameraPlaceholder) dom.cameraPlaceholder.hidden = false;
      if (dom.cameraState) dom.cameraState.innerHTML = '<i class="fa-solid fa-video-slash"></i><span>Sem câmera</span>';
      return;
    }
    if (dom.cameraPlaceholder) dom.cameraPlaceholder.hidden = true;
    if (dom.cameraImage) {
      dom.cameraImage.hidden = false;
      if (dom.cameraImage.src !== url) dom.cameraImage.src = url;
    }
    if (dom.cameraState) dom.cameraState.innerHTML = '<i class="fa-solid fa-video"></i><span>Câmera disponível</span>';
  }

  function updateCommandAvailability(p) {
    const enabled = Boolean(p.remoteControlEnabled && p.online);
    const caps = p.capabilities || {};
    const map = { PRINTER3D_PAUSE: "pause", PRINTER3D_RESUME: "resume", PRINTER3D_CANCEL: "cancel", PRINTER3D_HOME: "home", PRINTER3D_LIGHT_ON: "light", PRINTER3D_LIGHT_OFF: "light" };
    document.querySelectorAll("[data-printer3d-command]").forEach(button => {
      const cap = map[button.dataset.printer3dCommand];
      const declared = caps[cap];
      button.disabled = !enabled || declared === false;
      button.title = !enabled ? "Controle remoto desativado ou impressora offline." : declared === false ? "Recurso não suportado pelo bridge desta impressora." : "";
    });
    if (dom.controlMode) dom.controlMode.textContent = enabled ? "Controle remoto habilitado" : "Somente monitoramento";
    if (dom.controlNote) dom.controlNote.textContent = enabled ? "Comandos enviados ao Edge e executados apenas quando o bridge da impressora oferecer suporte." : "Habilite remoteControlEnabled no cadastro para liberar comandos. Monitoramento e câmera continuam disponíveis.";
  }

  async function sendPrinterCommand(command) {
    if (!activeMachineId || !token) return;
    const dangerous = command === "PRINTER3D_CANCEL" || command === "PRINTER3D_HOME";
    const confirmed = await (window.SteelUI?.confirm?.({ titulo: "Comando da impressora 3D", mensagem: `Enviar ${command}?`, confirmar: "Enviar", perigoso: dangerous }) ?? Promise.resolve(window.confirm(`Enviar ${command}?`)));
    if (!confirmed) return;
    const response = await fetch(`${API}/maquinas/${activeMachineId}/impressora3d/comandos`, { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:JSON.stringify({ comando:command, payload:{} }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.mensagem || "Comando não aceito.");
    window.SteelUI?.toast?.({ tipo:"success", titulo:"Impressora 3D", mensagem:data.mensagem || "Comando enviado." });
  }

  function update(machine) {
    const visible = isPrinter(machine);
    root.hidden = !visible;
    document.body?.classList.toggle("printer3d-dashboard-active", visible);
    const genericController = document.getElementById("controllerTela");
    if (genericController && visible) genericController.classList.remove("ativa");
    if (!visible) return;

    activeMachineId = machine?.id ?? machine?.maquinaId ?? localStorage.getItem("maquinaId");
    const p = extract(machine), labels = labelsForMode(p.mode), progress = pctNumber(p.progress) ?? 0, rawState = normalizeState(p.state), lower = rawState.toLowerCase();
    const printing = /print|imprim|working|running|process|fabricando/.test(lower), error = /error|falha|alarm|erro|emerg|fault/.test(lower), paused = /pause|paus/.test(lower);
    root.dataset.printerMode = p.mode;
    dom.subtitle.textContent = `${p.technology || "Universal"} • ${p.ecosystem || "Integração universal"} • IHM dedicada`;
    dom.state.className = `printer3d-state ${error ? "error" : printing ? "printing" : (p.online ? "online" : "")}`;
    dom.state.querySelector("strong").textContent = rawState;
    dom.file.textContent = compact(p.filename); dom.progressText.textContent = pct(progress); dom.progressBar.style.width = `${progress}%`;
    dom.layer.textContent = compact(p.layerCurrent); dom.layerDetail.textContent = `de ${compact(p.layerTotal)}`; dom.elapsed.textContent = duration(p.elapsed); dom.remainingValue.textContent = duration(p.remaining);
    const rem = num(p.remaining); dom.eta.textContent = rem === null ? "--" : new Date(Date.now() + rem * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    dom.nozzleLabel.textContent = labels.primary; dom.bedLabel.textContent = labels.bed; dom.chamberLabel.textContent = labels.chamber; dom.modeLabel.textContent = labels.mode;
    dom.nozzle.textContent = temp(p.primaryCurrent); dom.nozzleTarget.textContent = `Alvo: ${temp(p.primaryTarget)}`;
    dom.bed.textContent = temp(p.bedCurrent); dom.bedTarget.textContent = `Alvo: ${temp(p.bedTarget)}`;
    dom.chamber.textContent = temp(p.chamberCurrent); dom.chamberTarget.textContent = `Alvo: ${temp(p.chamberTarget)}`; dom.technology.textContent = `Tecnologia: ${p.technology || "--"}`;
    setThermalBar(dom.nozzleBar, p.primaryCurrent, p.primaryTarget, p.mode === "fdm" ? 320 : 120); setThermalBar(dom.bedBar, p.bedCurrent, p.bedTarget, 130); setThermalBar(dom.chamberBar, p.chamberCurrent, p.chamberTarget, 100);

    dom.speed.textContent = pct(p.speed); dom.fan.textContent = pct(p.fan);
    const flow = flowDescriptor(p), process = processDescriptor(p); dom.flowLabel.textContent = flow.label; dom.flow.textContent = flow.value; dom.processLabel.textContent = process.label; dom.processValue.textContent = process.value;
    dom.material.textContent = compact(p.material); dom.materialDetail.textContent = `Consumo: ${compact(p.materialUsed)}`; dom.materialRemaining.textContent = compact(p.materialRemaining);
    dom.axisX.textContent = axis(p.x); dom.axisY.textContent = axis(p.y); dom.axisZ.textContent = axis(p.z); dom.axisE.textContent = axis(p.e);
    dom.ecosystem.textContent = compact(p.ecosystem); dom.source.textContent = compact(p.source); dom.firmware.textContent = compact(p.firmware); dom.host.textContent = compact(p.host); dom.lastUpdate.textContent = formatLastUpdate(p.lastUpdate);
    dom.machineVisual.className = `printer3d-machine-visual ${printing ? "printing" : ""}`; dom.machineState.textContent = paused ? "Pausada" : rawState;

    const doorOpen = p.door === true || String(p.door).toLowerCase() === "open" || String(p.door).toLowerCase() === "aberta";
    const emergency = p.emergency === true || String(p.emergency).toLowerCase() === "true";
    const interlockBad = p.interlock === false || String(p.interlock).toLowerCase() === "false";
    dom.safetyPanel.className = `printer3d-panel printer3d-safety-panel ${error || emergency ? "error" : doorOpen || interlockBad ? "warning" : ""}`;
    dom.safetyState.textContent = emergency ? "Emergência ativa" : doorOpen ? "Porta / tampa aberta" : interlockBad ? "Intertravamento aberto" : "Monitoramento remoto";
    dom.alarm.textContent = compact(p.alarm) === "--" ? "Nenhum alarme informado pela impressora." : String(p.alarm);
    updateCamera(p);
    updateCommandAvailability(p);

    pushHistory(machine, p); drawTrend();
  }

  dom.cameraRefresh?.addEventListener("click", () => {
    if (!activeCameraUrl || !dom.cameraImage) return;
    const sep = activeCameraUrl.includes("?") ? "&" : "?";
    dom.cameraImage.src = `${activeCameraUrl}${sep}_steel=${Date.now()}`;
  });
  dom.cameraOpen?.addEventListener("click", () => { if (activeCameraUrl) window.open(activeCameraUrl, "_blank", "noopener,noreferrer"); });
  document.querySelectorAll("[data-printer3d-command]").forEach(button => button.addEventListener("click", async () => {
    try { await sendPrinterCommand(button.dataset.printer3dCommand); }
    catch (error) { window.SteelUI?.toast?.({ tipo:"error", titulo:"Impressora 3D", mensagem:error.message }); }
  }));

  window.SteelControlPrinter3D = { update, extract };
  if (typeof maquinaAtual !== "undefined" && maquinaAtual) update(maquinaAtual);
})();
