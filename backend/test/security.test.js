import test from "node:test";
import assert from "node:assert/strict";

import {
  criarRateLimit,
  securityHeaders
} from "../src/middlewares/security.js";

function criarResposta() {
  return {
    statusCode: 200,
    headers: {},
    body: null,

    setHeader(nome, valor) {
      this.headers[nome] = valor;
    },

    status(codigo) {
      this.statusCode = codigo;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    }
  };
}

test(
  "securityHeaders adiciona cabeçalhos de proteção",
  () => {
    const res =
      criarResposta();

    let nextChamado = false;

    securityHeaders(
      {},
      res,
      () => {
        nextChamado = true;
      }
    );

    assert.equal(
      res.headers["X-Content-Type-Options"],
      "nosniff"
    );

    assert.equal(
      res.headers["X-Frame-Options"],
      "DENY"
    );

    assert.equal(
      nextChamado,
      true
    );
  }
);

test(
  "rate limit permite chamadas dentro do limite",
  () => {
    const limiter =
      criarRateLimit({
        janelaMs: 10_000,
        limite: 2,
        prefixo:
          `test-ok-${Date.now()}`
      });

    const req = {
      headers: {},
      socket: {
        remoteAddress:
          "127.0.0.20"
      },
      body: {}
    };

    let chamadas = 0;

    limiter(
      req,
      criarResposta(),
      () => chamadas++
    );

    limiter(
      req,
      criarResposta(),
      () => chamadas++
    );

    assert.equal(
      chamadas,
      2
    );
  }
);

test(
  "rate limit bloqueia excesso com HTTP 429",
  () => {
    const limiter =
      criarRateLimit({
        janelaMs: 10_000,
        limite: 1,
        prefixo:
          `test-block-${Date.now()}`
      });

    const req = {
      headers: {},
      socket: {
        remoteAddress:
          "127.0.0.21"
      },
      body: {
        email:
          "teste@example.com"
      }
    };

    limiter(
      req,
      criarResposta(),
      () => {}
    );

    const res =
      criarResposta();

    limiter(
      req,
      res,
      () => {}
    );

    assert.equal(
      res.statusCode,
      429
    );

    assert.match(
      res.body.mensagem,
      /tentativas/i
    );
  }
);


test(
  "rate limit não confia diretamente em X-Forwarded-For",
  () => {
    const limiter =
      criarRateLimit({
        janelaMs: 10_000,
        limite: 1,
        prefixo:
          `test-forwarded-${Date.now()}`
      });

    const req1 = {
      headers: {
        "x-forwarded-for": "1.1.1.1"
      },
      socket: {
        remoteAddress: "127.0.0.30"
      },
      body: {}
    };

    const req2 = {
      headers: {
        "x-forwarded-for": "2.2.2.2"
      },
      socket: {
        remoteAddress: "127.0.0.30"
      },
      body: {}
    };

    limiter(
      req1,
      criarResposta(),
      () => {}
    );

    const res =
      criarResposta();

    limiter(
      req2,
      res,
      () => {}
    );

    assert.equal(
      res.statusCode,
      429
    );
  }
);
