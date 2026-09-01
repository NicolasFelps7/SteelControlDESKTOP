export function podeRegistrarManutencao(cargo) {
  return [
    "ADMINISTRADOR",
    "SUPERVISOR",
    "TECNICO"
  ].includes(
    String(cargo || "")
      .trim()
      .toUpperCase()
  );
}

export function podeExcluirManutencao(cargo) {
  return (
    String(cargo || "")
      .trim()
      .toUpperCase() ===
    "ADMINISTRADOR"
  );
}
