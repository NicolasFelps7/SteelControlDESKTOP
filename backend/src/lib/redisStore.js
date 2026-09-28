import { createClient } from "redis";

let client = null;
let connecting = null;
let lastError = null;

async function getClient() {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (!redisUrl) return null;
  if (client?.isReady) return client;
  if (connecting) return connecting;

  client = client || createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 1500,
      reconnectStrategy: retries => Math.min(250 * retries, 3000)
    }
  });
  client.on("error", erro => { lastError = erro; });

  connecting = client.connect()
    .then(() => client)
    .catch(erro => {
      lastError = erro;
      return null;
    })
    .finally(() => { connecting = null; });

  return connecting;
}

export async function redisRateLimit(key, windowMs) {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const result = await redis.eval(
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}",
      { keys: [`steelcontrol:ratelimit:${key}`], arguments: [String(windowMs)] }
    );
    return { quantidade: Number(result[0]), restanteMs: Math.max(0, Number(result[1])) };
  } catch (erro) {
    lastError = erro;
    return null;
  }
}

export async function redisHealth() {
  if (!String(process.env.REDIS_URL || "").trim()) return { configured: false, connected: false };
  const redis = await getClient();
  if (!redis) return { configured: true, connected: false, error: lastError?.message || "indisponível" };
  try {
    return { configured: true, connected: (await redis.ping()) === "PONG" };
  } catch (erro) {
    lastError = erro;
    return { configured: true, connected: false, error: erro.message };
  }
}

export async function requireRedis() {
  const health = await redisHealth();
  if (!health.configured || !health.connected) {
    const erro = new Error("Redis obrigatório indisponível no perfil de segurança nível 9.");
    erro.cause = lastError;
    throw erro;
  }
  return true;
}

export async function setSharedJson(key, value, ttlMs) {
  const redis = await getClient();
  if (!redis) return false;
  try {
    await redis.set(`steelcontrol:shared:${key}`, JSON.stringify(value), { PX: ttlMs });
    return true;
  } catch (erro) {
    lastError = erro;
    return false;
  }
}

export async function getSharedJson(key) {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(`steelcontrol:shared:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (erro) {
    lastError = erro;
    return null;
  }
}

export async function deleteShared(key) {
  const redis = await getClient();
  if (!redis) return false;
  try {
    await redis.del(`steelcontrol:shared:${key}`);
    return true;
  } catch (erro) {
    lastError = erro;
    return false;
  }
}
