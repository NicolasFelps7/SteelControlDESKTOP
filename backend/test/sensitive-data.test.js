import test from "node:test";
import assert from "node:assert/strict";

import {
  criptografarJsonSensivel,
  descriptografarJsonSensivel
} from "../src/lib/sensitiveData.js";

test("dado sensível usa envelope AES-256-GCM e restaura conteúdo", () => {
  const original = { templates: [{ tipo: "frontal", embedding: [0.1, 0.2, 0.3] }] };
  const encrypted = criptografarJsonSensivel(original);
  assert.equal(encrypted.encrypted, true);
  assert.equal(encrypted.algorithm, "A256GCM");
  assert.equal(JSON.stringify(encrypted).includes("frontal"), false);
  assert.deepEqual(descriptografarJsonSensivel(encrypted), original);
});

test("alteração do ciphertext é detectada pela autenticação GCM", () => {
  const encrypted = criptografarJsonSensivel({ segredo: "biometria" });
  const bytes = Buffer.from(encrypted.ciphertext, "base64");
  bytes[0] ^= 1;
  encrypted.ciphertext = bytes.toString("base64");
  assert.throws(() => descriptografarJsonSensivel(encrypted));
});
