(() => {
  const API = window.STEELCONTROL_API_URL;
  const token = localStorage.getItem("token");
  const maquinaId = localStorage.getItem("maquinaId");
  if (!token || !maquinaId) return;

  const dom = {
    vibracao: document.getElementById("vibracao"),
    corrente: document.getElementById("corrente"),
    badge: document.getElementById("runtimeConnectionBadge"),
    controller: document.getElementById("runtimeController"),
    protocol: document.getElementById("runtimeProtocol"),
    lastSignal: document.getElementById("runtimeLastSignal"),
    quality: document.getElementById("runtimeSignalQuality"),
    latency: document.getElementById("runtimeLatency"),
    keyHint: document.getElementById("runtimeDeviceKeyHint"),
    safety: document.getElementById("runtimeSafetyBox"),
    safetyStatus: document.getElementById("runtimeSafetyStatus"),
    safetyReason: document.getElementById("runtimeSafetyReason"),
    release: document.getElementById("runtimeReleaseButton"),
    demo: document.getElementById("runtimeDemoPanel")
  };

  const controladorLabel = valor => ({
    ESP32: "ESP32", DOBOT_MAGICIAN: "Dobot Magician", CLP_PLC: "CLP / PLC", CONTROLADOR_ROBOTICO: "Controlador robótico",
    CNC: "CNC", GATEWAY_INDUSTRIAL: "Gateway industrial", OUTRO: "Outro"
  })[valor] || valor || "Não definido";

  const protocoloLabel = valor => ({
    HTTP_REST: "HTTP / REST", USB_SERIAL: "USB / Serial", MQTT: "MQTT", MODBUS_TCP: "Modbus TCP",
    OPC_UA: "OPC UA", TCP_IP: "TCP/IP", OUTRO: "Outro"
  })[valor] || valor || "Não definido";

  let diagnosticoAtual = null;
  let streamAtivo = false;
  let ultimaMensagemStreamEm = 0;
  let fallbackTimer = null;
  let simuladorTimer = null;
  let parando = false;

  async function fetchAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.set("Cache-Control", "no-cache");
    return fetch(url, { ...options, headers, cache: "no-store" });
  }

  function tempoRelativo(data) {
    if (!data) return "Nenhum sinal recebido";
    const ts = new Date(data).getTime();
    if (!Number.isFinite(ts)) return "--";
    const segundos = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (segundos < 2) return "agora";
    if (segundos < 60) return `há ${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `há ${minutos} min`;
    return new Date(data).toLocaleString("pt-BR");
  }

  function estadoLocal(diag) {
    const base = diag?.estadoConexao || {};
    if (diag?.modoSimulacao) return { ...base, codigo: "SIMULACAO", texto: "Modo simulação" };
    const ultimo = base.ultimoSinalEm || diag?.ultimoHeartbeatEm || diag?.ultimaTelemetriaEm;
    if (!ultimo) return { ...base, codigo: "OFFLINE", texto: "Máquina offline" };

    const idade = Math.max(0, Date.now() - new Date(ultimo).getTime());
    const intervalo = Math.max(500, Number(diag?.intervaloLeitura) || 2000);
    const estavel = Math.max(3000, intervalo * 2);
    const offline = Math.max(10000, Math.min(180000, intervalo * 5));
    const qualidadeRuim = Number.isFinite(Number(diag?.qualidadeSinal)) && Number(diag.qualidadeSinal) < 35;

    if (idade <= estavel && !qualidadeRuim) return { ...base, codigo: "CONECTADA", texto: "Máquina conectada", ultimoSinalEm: ultimo };
    if (idade <= offline) return { ...base, codigo: "INSTAVEL", texto: "Conexão instável", ultimoSinalEm: ultimo };
    return { ...base, codigo: "OFFLINE", texto: "Máquina offline", ultimoSinalEm: ultimo };
  }

  function atualizarMetricas(snapshot) {
    if (!snapshot) return;
    if (dom.vibracao && snapshot.vibracao !== undefined) dom.vibracao.textContent = `${Number(snapshot.vibracao || 0).toFixed(2)} mm/s`;
    if (dom.corrente && snapshot.corrente !== undefined) dom.corrente.textContent = `${Number(snapshot.corrente || 0).toFixed(2)} A`;
  }

  function atualizarDiagnostico(diag) {
    if (!diag) return;
    diagnosticoAtual = { ...(diagnosticoAtual || {}), ...diag };
    window.dispatchEvent(new CustomEvent("steelcontrol:machine-diagnostic", { detail: diagnosticoAtual }));
    const estado = estadoLocal(diagnosticoAtual);
    const codigo = String(estado.codigo || "OFFLINE").toUpperCase();

    if (dom.badge) {
      dom.badge.className = "runtime-connection-badge";
      if (codigo === "CONECTADA") dom.badge.classList.add("connected");
      else if (codigo === "INSTAVEL") dom.badge.classList.add("unstable");
      else if (codigo === "SIMULACAO") dom.badge.classList.add("simulation");
      else dom.badge.classList.add("offline");
      dom.badge.replaceChildren();
      const dot = document.createElement("span");
      dom.badge.append(dot, document.createTextNode(estado.texto || "Máquina offline"));
    }

    if (dom.controller) dom.controller.textContent = controladorLabel(diagnosticoAtual.controlador);
    if (dom.protocol) dom.protocol.textContent = protocoloLabel(diagnosticoAtual.protocolo);
    if (dom.lastSignal) dom.lastSignal.textContent = tempoRelativo(estado.ultimoSinalEm || diagnosticoAtual.ultimoHeartbeatEm || diagnosticoAtual.ultimaTelemetriaEm);
    if (dom.quality) dom.quality.textContent = diagnosticoAtual.qualidadeSinal == null ? "Não informado" : `${diagnosticoAtual.qualidadeSinal}%`;
    if (dom.latency) dom.latency.textContent = diagnosticoAtual.latenciaMs == null ? "Não informado" : `${diagnosticoAtual.latenciaMs} ms`;
    if (dom.keyHint) dom.keyHint.textContent = diagnosticoAtual.deviceKeyHint || "Não gerada";
    if (dom.safety) dom.safety.classList.toggle("danger", Boolean(diagnosticoAtual.paradaSeguranca));
    if (dom.safetyStatus) dom.safetyStatus.textContent = diagnosticoAtual.paradaSeguranca ? "Parada de segurança ativa" : "Operação liberada";
    if (dom.safetyReason) dom.safetyReason.textContent = diagnosticoAtual.paradaSeguranca ? (diagnosticoAtual.motivoParada || "Condição crítica detectada.") : "Nenhuma parada de segurança ativa.";
    if (dom.release) dom.release.hidden = !diagnosticoAtual.paradaSeguranca;
    if (dom.demo) dom.demo.hidden = !diagnosticoAtual.modoSimulacao;

    configurarGeradorSimulacao();
  }

  async function carregarDiagnostico() {
    try {
      const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}/diagnostico`);
      if (!resposta.ok) return false;
      atualizarDiagnostico(await resposta.json());
      return true;
    } catch (_) {
      return false;
    }
  }

  function aplicarSnapshot(snapshot) {
    if (!snapshot) return;
    window.dispatchEvent(new CustomEvent("steelcontrol:machine-snapshot", { detail: snapshot }));
    atualizarMetricas(snapshot);
    diagnosticoAtual = {
      ...(diagnosticoAtual || {}),
      ...snapshot,
      estadoConexao: snapshot.estadoConexao || diagnosticoAtual?.estadoConexao,
      ultimaTelemetriaEm: snapshot.ultimaTelemetriaEm || diagnosticoAtual?.ultimaTelemetriaEm,
      qualidadeSinal: snapshot.qualidadeSinal ?? diagnosticoAtual?.qualidadeSinal,
      latenciaMs: snapshot.latenciaMs ?? diagnosticoAtual?.latenciaMs
    };
    atualizarDiagnostico(diagnosticoAtual);
    if (typeof window.aplicarTelemetriaTempoReal === "function") {
      window.aplicarTelemetriaTempoReal(snapshot);
    }
  }

  async function fallbackAtualizar() {
    if (streamAtivo) return;
    try {
      const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}`);
      if (!resposta.ok) return;
      const snapshot = await resposta.json();
      aplicarSnapshot(snapshot);
    } catch (_) {}
  }

  function ativarFallback() {
    if (fallbackTimer) return;
    fallbackTimer = setInterval(fallbackAtualizar, 4000);
    fallbackAtualizar();
  }

  function desativarFallback() {
    if (!fallbackTimer) return;
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }

  async function pulsarSimulador() {
    if (!diagnosticoAtual?.modoSimulacao || parando) return;
    try {
      const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}/simular`, { method: "POST" });
      if (!resposta.ok) return;
      // Se SSE estiver indisponível, usamos a própria resposta como fallback.
      if (!streamAtivo) aplicarSnapshot(await resposta.json());
    } catch (_) {}
  }

  function configurarGeradorSimulacao() {
    const deveRodar = Boolean(diagnosticoAtual?.modoSimulacao);
    if (deveRodar && !simuladorTimer) {
      simuladorTimer = setInterval(pulsarSimulador, 2000);
      pulsarSimulador();
    } else if (!deveRodar && simuladorTimer) {
      clearInterval(simuladorTimer);
      simuladorTimer = null;
    }
  }

  async function iniciarStream() {
    let espera = 1200;
    while (!parando) {
      try {
        const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}/stream`, { headers: { Accept: "text/event-stream" } });
        if (!resposta.ok || !resposta.body) throw new Error("stream indisponível");

        streamAtivo = true;
        ultimaMensagemStreamEm = Date.now();
        desativarFallback();
        espera = 1200;

        const reader = resposta.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!parando) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocos = buffer.split("\n\n");
          buffer = blocos.pop() || "";

          for (const bloco of blocos) {
            const linhaData = bloco.split("\n").find(linha => linha.startsWith("data:"));
            if (!linhaData) continue;
            try {
              const evento = JSON.parse(linhaData.slice(5).trim());
              ultimaMensagemStreamEm = Date.now();
              if (evento.tipo === "telemetria" || evento.tipo === "seguranca") aplicarSnapshot(evento.dados);
              else if (evento.tipo === "heartbeat") atualizarDiagnostico({ ...(diagnosticoAtual || {}), ...evento.dados });
              else if (evento.tipo === "configuracao") await carregarDiagnostico();
            } catch (_) {}
          }
        }
      } catch (_) {
        // SSE é o principal; polling só entra quando o stream falha.
      } finally {
        streamAtivo = false;
        ativarFallback();
      }

      await new Promise(resolve => setTimeout(resolve, espera));
      espera = Math.min(10000, Math.round(espera * 1.7));
    }
  }

  dom.release?.addEventListener("click", async () => {
    dom.release.disabled = true;
    try {
      const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}/liberar-seguranca`, { method: "POST" });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        window.SteelUI?.toast?.({ tipo: "warning", titulo: "Liberação não realizada", mensagem: dados.mensagem || "Não foi possível liberar o equipamento." });
        return;
      }
      aplicarSnapshot(dados);
    } finally {
      dom.release.disabled = false;
    }
  });

  document.querySelectorAll("[data-demo]").forEach(botao => {
    botao.addEventListener("click", async () => {
      const cenario = botao.dataset.demo;
      botao.disabled = true;
      try {
        const resposta = await fetchAuth(`${API}/maquinas/${maquinaId}/demonstracao`, {
          method: "POST", body: JSON.stringify({ cenario })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
          window.SteelUI?.toast?.({ tipo: "error", titulo: "Cenário indisponível", mensagem: dados.mensagem || "Não foi possível executar o cenário." });
          return;
        }
        if (!streamAtivo) aplicarSnapshot(dados);
      } finally {
        botao.disabled = false;
      }
    });
  });

  // Atualiza apenas a idade visual do sinal; não consulta a API.
  setInterval(() => diagnosticoAtual && atualizarDiagnostico(diagnosticoAtual), 1000);
  window.addEventListener("beforeunload", () => { parando = true; });

  carregarDiagnostico().finally(() => {
    ativarFallback();
    iniciarStream();
  });
})();
