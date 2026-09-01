import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { securityHeaders, criarRateLimit } from "./middlewares/security.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { machineRoutes } from "./modules/machines/machine.routes.js";
import { maintenanceRoutes } from "./modules/maintenance/maintenance.routes.js";
import { companyRoutes } from "./modules/company/company.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";
import { deviceRoutes } from "./modules/device/device.routes.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const frontendDir =
  path.resolve(
    __dirname,
    "../../frontend"
  );

const uploadsDir =
  path.resolve(
    __dirname,
    "../uploads"
  );

export const app =
  express();

// Em hospedagens como Render/Railway o Express fica atrás de proxy.
// Isto faz req.ip/req.protocol refletirem corretamente o cliente/HTTPS.
if (
  env.nodeEnv === "production"
) {
  app.set(
    "trust proxy",
    1
  );
}

// =========================================================
// SEGURANÇA / LIMITES
// =========================================================

app.use(
  securityHeaders
);

app.use(
  criarRateLimit({
    janelaMs: 60_000,
    limite: 1200,
    prefixo: "api"
  })
);

// =========================================================
// CORS
// =========================================================
// O frontend de produção é servido pelo mesmo backend, portanto a
// origem do próprio host é aceita automaticamente. CORS_ORIGINS fica
// disponível para Flutter Web ou outro frontend em domínio separado.

app.use(
  (req, res, next) => {
    const middleware =
      cors({
        origin(origin, callback) {
          if (!origin) {
            return callback(
              null,
              true
            );
          }

          const host =
            req.get("host");

          const mesmaOrigem =
            Boolean(host) &&
            origin ===
              `${req.protocol}://${host}`;

          const permitido =
            mesmaOrigem ||
            env.corsOrigins.includes(
              origin
            ) ||
            (
              env.nodeEnv !== "production" &&
              /^https?:\/\/(127\.0\.0\.1|localhost):\d+$/.test(
                origin
              )
            );

          if (permitido) {
            return callback(
              null,
              true
            );
          }

          return callback(
            new Error(
              "Origem não autorizada pelo CORS."
            )
          );
        },
        methods: [
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE",
          "OPTIONS"
        ],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Device-Key"
        ],
        maxAge: 86400
      });

    return middleware(
      req,
      res,
      next
    );
  }
);

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb"
  })
);

// =========================================================
// LEGADO DE UPLOAD LOCAL
// =========================================================
// Mantido apenas para instalações antigas. Logos novas são salvas no
// PostgreSQL e não dependem do filesystem efêmero da hospedagem.

app.use(
  "/uploads",
  express.static(
    uploadsDir,
    {
      fallthrough: true,
      maxAge:
        env.nodeEnv === "production"
          ? "1h"
          : 0
    }
  )
);

// =========================================================
// HEALTH / INFORMAÇÕES DA API
// =========================================================

app.get(
  "/api",
  (req, res) => {
    return res.json({
      service: "SteelControl API",
      status: "ok",
      environment:
        env.nodeEnv
    });
  }
);

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return res.json({
        status: "ok",
        banco: "PostgreSQL",
        bancoConectado: true
      });
    } catch {
      return res
        .status(503)
        .json({
          status: "degraded",
          banco: "PostgreSQL",
          bancoConectado: false
        });
    }
  }
);

// =========================================================
// API
// =========================================================

app.use(
  "/auth",
  authRoutes
);

app.use(
  "/empresa",
  companyRoutes
);

app.use(
  "/maquinas",
  machineRoutes
);

app.use(
  "/maquinas",
  maintenanceRoutes
);

app.use(
  "/device",
  deviceRoutes
);

app.use(
  "/auditoria",
  auditRoutes
);

// =========================================================
// FRONTEND
// =========================================================
// Frontend e API usam a mesma origem, como em produção.
// As rotas /app/* não expõem nomes de arquivos .html.

app.get(
  "/",
  (req, res) => {
    return res.redirect(
      302,
      "/app/login"
    );
  }
);

const paginasFrontend = {
  "/app/home": "home.html",
  "/app/login": "login.html",
  "/app/maquinas": "maquinas.html",
  "/app/dashboard": "index.html",
  "/app/empresa": "empresa.html"
};

for (
  const [rota, arquivo]
  of Object.entries(paginasFrontend)
) {
  app.get(
    rota,
    (req, res) =>
      res.sendFile(
        path.join(
          frontendDir,
          arquivo
        )
      )
  );
}

app.get(
  "/app",
  (req, res) =>
    res.redirect(
      302,
      "/app/login"
    )
);

app.use(
  "/app",
  express.static(
    frontendDir,
    {
      etag: true,
      maxAge:
        env.nodeEnv === "production"
          ? "1h"
          : 0
    }
  )
);

// Compatibilidade temporária com URLs antigas terminadas em .html.
app.use(
  express.static(
    frontendDir,
    {
      etag: true,
      maxAge:
        env.nodeEnv === "production"
          ? "1h"
          : 0,
      setHeaders(
        res,
        filePath
      ) {
        if (
          filePath.endsWith(
            ".html"
          )
        ) {
          res.setHeader(
            "Cache-Control",
            "no-cache"
          );
        }
      }
    }
  )
);

// =========================================================
// 404
// =========================================================

app.use(
  (req, res) => {
    const apiRequest =
      [
        "/api",
        "/auth",
        "/empresa",
        "/maquinas",
        "/device",
        "/auditoria"
      ].some(
        prefixo =>
          req.path.startsWith(
            prefixo
          )
      );

    if (apiRequest) {
      return res
        .status(404)
        .json({
          mensagem:
            "Rota não encontrada."
        });
    }

    return res
      .status(404)
      .type("text/plain")
      .send(
        "Página não encontrada."
      );
  }
);

// =========================================================
// ERROS
// =========================================================

app.use(
  (
    erro,
    req,
    res,
    next
  ) => {
    console.error(
      "================================"
    );
    console.error(
      "ERRO NA API:"
    );
    console.error(
      erro
    );
    console.error(
      "================================"
    );

    if (
      erro?.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "O arquivo excede o tamanho permitido."
        });
    }

    if (
      erro?.message?.includes(
        "Formato de imagem"
      ) ||
      erro?.message?.includes(
        "JPG"
      ) ||
      erro?.message?.includes(
        "PNG"
      ) ||
      erro?.message?.includes(
        "WEBP"
      )
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            erro.message
        });
    }

    if (
      erro?.message ===
      "Origem não autorizada pelo CORS."
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            erro.message
        });
    }

    const mensagemTecnica =
      String(
        erro?.message ||
        ""
      );

    const erroInternoBanco =
      mensagemTecnica.includes(
        "Invalid `prisma."
      ) ||
      mensagemTecnica.includes(
        "Unknown argument"
      ) ||
      mensagemTecnica.includes(
        "PrismaClient"
      ) ||
      mensagemTecnica.includes(
        "Available options"
      );

    return res
      .status(
        erro.statusCode ||
        erro.status ||
        500
      )
      .json({
        mensagem:
          erroInternoBanco
            ? "Não foi possível concluir a operação no banco de dados. Verifique as migrations e reinicie o backend."
            : (
                (erro.statusCode || erro.status) && erro.message
                  ? erro.message
                  : "Erro interno do servidor."
              )
      });
  }
);
