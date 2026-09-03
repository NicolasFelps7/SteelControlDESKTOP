import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ||= "test-jwt-secret-with-at-least-32-characters";
process.env.DATABASE_URL ||= "postgresql://steelcontrol:steelcontrol@127.0.0.1:5432/steelcontrol_test";
process.env.NODE_ENV ||= "development";

const {
  getDiscoveryDiagnostics,
  isPrivateIPv4,
  probeDeviceByIp
} = await import("../src/lib/deviceDiscovery.js");

test("descoberta aceita somente faixas IPv4 locais/privadas", () => {
  assert.equal(isPrivateIPv4("192.168.0.87"), true);
  assert.equal(isPrivateIPv4("10.0.0.10"), true);
  assert.equal(isPrivateIPv4("172.20.1.5"), true);
  assert.equal(isPrivateIPv4("8.8.8.8"), false);
  assert.equal(isPrivateIPv4("example.com"), false);
});

test("fallback por IP recusa endereço público antes de acessar a rede", async () => {
  await assert.rejects(
    () => probeDeviceByIp("8.8.8.8", 80),
    /IPv4 privado\/local válido/i
  );
});

test("fallback por IP recusa porta inválida antes de acessar a rede", async () => {
  await assert.rejects(
    () => probeDeviceByIp("192.168.0.87", 70000),
    /porta válida/i
  );
});

test("diagnóstico expõe fallback fixo sem liberar comandos", () => {
  const diagnostico = getDiscoveryDiagnostics();
  assert.equal(diagnostico.ipFallback.enabled, true);
  assert.equal(diagnostico.ipFallback.path, "/steelcontrol/discovery");
  assert.equal(Array.isArray(diagnostico.interfaces), true);
  assert.equal(Array.isArray(diagnostico.issues), true);
});
