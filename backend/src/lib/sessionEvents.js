const clientesPorUsuario = new Map();

function removerCliente(usuarioId, res) {
  const clientes = clientesPorUsuario.get(usuarioId);
  if (!clientes) return;

  clientes.delete(res);
  if (!clientes.size) {
    clientesPorUsuario.delete(usuarioId);
  }
}

export function streamSessionEvents(req, res) {
  const usuarioId = Number(req.auth?.usuarioId);

  if (!Number.isInteger(usuarioId)) {
    return res.status(401).json({
      mensagem: "Sessão inválida."
    });
  }

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders?.();

  let clientes = clientesPorUsuario.get(usuarioId);
  if (!clientes) {
    clientes = new Set();
    clientesPorUsuario.set(usuarioId, clientes);
  }
  clientes.add(res);

  res.write("retry: 3000\n");
  res.write("event: ready\n");
  res.write(`data: ${JSON.stringify({ conectado: true })}\n\n`);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }
  }, 20000);
  heartbeat.unref?.();

  const encerrar = () => {
    clearInterval(heartbeat);
    removerCliente(usuarioId, res);
  };

  req.on("close", encerrar);
  res.on("close", encerrar);

  return undefined;
}

export function revogarSessoesUsuario(usuarioId, motivo = "Seu acesso ao SteelControl foi encerrado pelo administrador.") {
  const id = Number(usuarioId);
  const clientes = clientesPorUsuario.get(id);

  if (!clientes?.size) {
    return 0;
  }

  let enviados = 0;
  const payload = JSON.stringify({
    motivo,
    encerradaEm: new Date().toISOString()
  });

  for (const res of [...clientes]) {
    try {
      if (!res.writableEnded) {
        res.write("event: revoked\n");
        res.write(`data: ${payload}\n\n`);
        res.end();
        enviados += 1;
      }
    } catch {
      // O auth middleware continua bloqueando qualquer requisição futura.
    }
  }

  clientesPorUsuario.delete(id);
  return enviados;
}
