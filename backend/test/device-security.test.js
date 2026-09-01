import test from "node:test";
import assert from "node:assert/strict";
import {
  gerarDeviceKey,
  hashDeviceKey,
  deviceKeyHint,
  compararDeviceKey
} from "../src/lib/deviceSecurity.js";


test("device key é aleatória e possui prefixo SteelControl", () => {
  const a = gerarDeviceKey();
  const b = gerarDeviceKey();
  assert.match(a, /^scd_/);
  assert.notEqual(a, b);
});


test("device key valida somente contra seu hash", () => {
  const chave = gerarDeviceKey();
  const hash = hashDeviceKey(chave);
  assert.equal(compararDeviceKey(chave, hash), true);
  assert.equal(compararDeviceKey(`${chave}x`, hash), false);
});


test("hint não expõe a chave inteira", () => {
  const chave = gerarDeviceKey();
  const hint = deviceKeyHint(chave);
  assert.ok(hint.endsWith(chave.slice(-6)));
  assert.equal(hint.includes(chave), false);
});
