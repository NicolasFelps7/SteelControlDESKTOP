import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const baseEnv = {
  ...process.env,
  NODE_ENV: "production",
  SECURITY_PROFILE: "level9",
  PORT: "3000",
  DATABASE_URL: "postgresql://user:pass@127.0.0.1:5432/steelcontrol",
  JWT_SECRET: "a".repeat(96),
  SENSITIVE_DATA_KEY: Buffer.alloc(32, 7).toString("base64"),
  FACE_API_URL: "http://127.0.0.1:8000",
  FACE_API_KEY: "b".repeat(64),
  EMAIL_USER: "admin@example.com",
  EMAIL_APP_PASSWORD: "senha-de-aplicativo",
  REDIS_URL: "redis://:senha@127.0.0.1:6379/0",
  MONITORING_TOKEN: "c".repeat(64),
  ENFORCE_HTTPS: "true",
  ADMIN_MFA_REQUIRED: "true",
  SESSION_COOKIE_MAX_AGE_MS: "1800000",
  CORS_ORIGINS: "https://steelcontrol.example.com"
};

function carregarConfig(env) {
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", 'import("./src/config/env.js")'],
    { cwd: new URL("..", import.meta.url), env, encoding: "utf8" }
  );
}

test("perfil level9 aceita configuração completa", () => {
  const result = carregarConfig(baseEnv);
  assert.equal(result.status, 0, result.stderr);
});

test("perfil level9 recusa iniciar sem Redis", () => {
  const env = { ...baseEnv };
  delete env.REDIS_URL;
  const result = carregarConfig(env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /REDIS_URL/);
});

test("perfil level9 recusa CORS sem HTTPS", () => {
  const result = carregarConfig({ ...baseEnv, CORS_ORIGINS: "http://steelcontrol.example.com" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CORS.*HTTPS/i);
});

