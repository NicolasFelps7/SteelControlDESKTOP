import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

import {
  streamSessionEvents,
  revogarSessoesUsuario
} from "../src/lib/sessionEvents.js";

function criarReq(usuarioId) {
  const req = new EventEmitter();
  req.auth = { usuarioId };
  return req;
}

function criarRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.chunks = [];
  res.writableEnded = false;
  res.status = codigo => { res.statusCode = codigo; return res; };
  res.set = headers => { Object.assign(res.headers, headers); return res; };
  res.flushHeaders = () => {};
  res.write = chunk => { res.chunks.push(String(chunk)); return true; };
  res.end = () => { res.writableEnded = true; res.emit("close"); };
  res.json = body => { res.body = body; return res; };
  return res;
}

test("session events entrega revogação ao usuário conectado", () => {
  const req = criarReq(77);
  const res = criarRes();
  streamSessionEvents(req, res);

  const enviados = revogarSessoesUsuario(77, "Acesso encerrado para teste.");

  assert.equal(enviados, 1);
  assert.equal(res.writableEnded, true);
  assert.match(res.chunks.join(""), /event: revoked/);
  assert.match(res.chunks.join(""), /Acesso encerrado para teste/);
});

test("revogar usuário sem stream conectado é idempotente", () => {
  assert.equal(revogarSessoesUsuario(999999, "teste"), 0);
});
