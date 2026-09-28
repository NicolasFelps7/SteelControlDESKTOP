import { env } from "../config/env.js";

const PROD_COOKIE = "__Host-sc_session";
const DEV_COOKIE = "sc_session";

function cookieName() {
  return env.nodeEnv === "production" ? PROD_COOKIE : DEV_COOKIE;
}

function parseCookies(header = "") {
  return String(header)
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf("=");
      if (separator <= 0) return cookies;
      const key = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
      return cookies;
    }, {});
}

function serialize(name, value, { maxAge = env.sessionCookieMaxAgeMs } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}`
  ];
  if (env.nodeEnv === "production") parts.push("Secure");
  return parts.join("; ");
}

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", serialize(cookieName(), token));
  res.setHeader("Cache-Control", "no-store");
}

export function clearSessionCookie(res) {
  const names = [...new Set([cookieName(), PROD_COOKIE, DEV_COOKIE])];
  res.setHeader(
    "Set-Cookie",
    names.map(name => serialize(name, "", { maxAge: 0 }))
  );
  res.setHeader("Cache-Control", "no-store");
}

export function sessionTokenFromCookie(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[PROD_COOKIE] || cookies[DEV_COOKIE] || "";
}

export function clientWantsBearer(req) {
  const marker = String(
    req.get?.("X-SteelControl-Client") || req.body?.clientType || ""
  ).toLowerCase();
  // Clientes antigos/API continuam recebendo bearer. O navegador moderno se
  // identifica explicitamente para nunca expor o JWT ao JavaScript.
  return !["desktop", "browser", "web"].includes(marker);
}
