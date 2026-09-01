import { EventEmitter } from "events";

const bus = new EventEmitter();
bus.setMaxListeners(0);

function canal(maquinaId) {
  return `maquina:${Number(maquinaId)}`;
}

export function publicarEventoMaquina(maquinaId, tipo, dados) {
  bus.emit(canal(maquinaId), {
    tipo,
    dados,
    em: new Date().toISOString()
  });
}

export function assinarEventosMaquina(maquinaId, listener) {
  const nomeCanal = canal(maquinaId);
  bus.on(nomeCanal, listener);

  return () => {
    bus.off(nomeCanal, listener);
  };
}
