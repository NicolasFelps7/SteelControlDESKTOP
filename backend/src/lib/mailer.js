import nodemailer from "nodemailer";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";


// =========================================================
// HELPERS
// =========================================================

function escaparHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// LOGO
// =========================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const caminhoLogo =
  path.resolve(
    __dirname,
    "../../../frontend/assets/img/steel-icon.png"
  );


function logoExiste() {
  return fs.existsSync(
    caminhoLogo
  );
}


// =========================================================
// TRANSPORTER GMAIL
// =========================================================

function criarTransporter() {
  if (
    !env.emailUser ||
    !env.emailAppPassword
  ) {
    const erro =
      new Error(
        "Envio de e-mail não configurado. Defina EMAIL_USER e EMAIL_APP_PASSWORD no arquivo .env."
      );

    erro.statusCode =
      503;

    throw erro;
  }

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user:
        env.emailUser,

      pass:
        env.emailAppPassword
    }
  });
}


// =========================================================
// TEMPLATE VISUAL
// =========================================================

function criarTemplateEmail({
  titulo,
  subtitulo,
  nome,
  codigo,
  mensagemPrincipal,
  mensagemSecundaria
}) {
  const nomeSeguro =
    escaparHtml(
      nome || "usuário"
    );

  const tituloSeguro =
    escaparHtml(
      titulo
    );

  const subtituloSeguro =
    escaparHtml(
      subtitulo
    );

  const mensagemPrincipalSegura =
    escaparHtml(
      mensagemPrincipal
    );

  const mensagemSecundariaSegura =
    escaparHtml(
      mensagemSecundaria
    );

  return `
    <!DOCTYPE html>

    <html lang="pt-BR">

      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          ${tituloSeguro}
        </title>
      </head>


      <body
        style="
          margin:0;
          padding:0;
          background:#eef2f7;
          font-family:Arial,Helvetica,sans-serif;
        "
      >

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            background:#eef2f7;
            padding:40px 16px;
          "
        >

          <tr>

            <td align="center">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  max-width:600px;
                  background:#ffffff;
                  border-radius:22px;
                  overflow:hidden;
                  border:1px solid #dbe3ee;
                  box-shadow:0 12px 30px rgba(15,23,42,0.08);
                "
              >


                <!-- CABEÇALHO -->

                <tr>

                  <td
                    align="center"
                    style="
                      padding:36px 28px 30px;
                      background:
                        linear-gradient(
                          135deg,
                          #0f172a 0%,
                          #172554 55%,
                          #1d4ed8 100%
                        );
                    "
                  >

                    ${
                      logoExiste()
                        ? `
                          <img
                            src="cid:steelcontrol-logo"
                            alt="SteelControl"
                            width="92"
                            style="
                              display:block;
                              width:92px;
                              max-width:92px;
                              height:auto;
                              margin:0 auto 18px;
                              object-fit:contain;
                            "
                          />
                        `
                        : ""
                    }


                    <div
                      style="
                        color:#93c5fd;
                        font-size:12px;
                        font-weight:700;
                        letter-spacing:2.5px;
                        text-transform:uppercase;
                        margin-bottom:10px;
                      "
                    >
                      STEELCONTROL
                    </div>


                    <h1
                      style="
                        margin:0;
                        color:#ffffff;
                        font-size:28px;
                        line-height:1.25;
                        font-weight:800;
                      "
                    >
                      ${tituloSeguro}
                    </h1>


                    <p
                      style="
                        margin:12px 0 0;
                        color:#dbeafe;
                        font-size:14px;
                        line-height:1.6;
                      "
                    >
                      ${subtituloSeguro}
                    </p>

                  </td>

                </tr>


                <!-- CONTEÚDO -->

                <tr>

                  <td
                    style="
                      padding:34px 32px 30px;
                    "
                  >

                    <p
                      style="
                        margin:0 0 14px;
                        color:#0f172a;
                        font-size:16px;
                        line-height:1.7;
                      "
                    >
                      Olá,
                      <strong>
                        ${nomeSeguro}
                      </strong>.
                    </p>


                    <p
                      style="
                        margin:0 0 24px;
                        color:#475569;
                        font-size:14px;
                        line-height:1.75;
                      "
                    >
                      ${mensagemPrincipalSegura}
                    </p>


                    <!-- CÓDIGO -->

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        margin:26px 0;
                      "
                    >

                      <tr>

                        <td
                          align="center"
                          style="
                            padding:26px 20px;
                            border-radius:18px;
                            border:1px solid #bfdbfe;
                            background:#eff6ff;
                          "
                        >

                          <div
                            style="
                              color:#64748b;
                              font-size:11px;
                              font-weight:700;
                              letter-spacing:1.5px;
                              text-transform:uppercase;
                              margin-bottom:12px;
                            "
                          >
                            Código de confirmação
                          </div>


                          <div
                            style="
                              color:#2563eb;
                              font-size:40px;
                              line-height:1;
                              font-weight:800;
                              letter-spacing:12px;
                            "
                          >
                            ${codigo}
                          </div>

                        </td>

                      </tr>

                    </table>


                    <!-- VALIDADE -->

                    <div
                      style="
                        display:block;
                        margin:0 0 16px;
                        padding:14px 16px;
                        border-radius:12px;
                        background:#f8fafc;
                        border:1px solid #e2e8f0;
                        color:#475569;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      ⏱ Este código expira em
                      <strong>
                        10 minutos
                      </strong>.
                    </div>


                    <p
                      style="
                        margin:0;
                        color:#64748b;
                        font-size:13px;
                        line-height:1.7;
                      "
                    >
                      ${mensagemSecundariaSegura}
                    </p>


                    <!-- SEGURANÇA -->

                    <div
                      style="
                        margin-top:24px;
                        padding:16px;
                        border-radius:12px;
                        background:#fff7ed;
                        border:1px solid #fed7aa;
                        color:#9a3412;
                        font-size:12px;
                        line-height:1.6;
                      "
                    >
                      🔒 Se você não solicitou esta ação,
                      pode ignorar este e-mail com segurança.
                    </div>

                  </td>

                </tr>


                <!-- RODAPÉ -->

                <tr>

                  <td
                    align="center"
                    style="
                      padding:22px 24px 24px;
                      border-top:1px solid #e2e8f0;
                      background:#f8fafc;
                    "
                  >

                    <div
                      style="
                        color:#0f172a;
                        font-size:13px;
                        font-weight:700;
                        margin-bottom:5px;
                      "
                    >
                      SteelControl
                    </div>


                    <div
                      style="
                        color:#94a3b8;
                        font-size:11px;
                        line-height:1.6;
                      "
                    >
                      Gestão industrial inteligente
                    </div>


                    <div
                      style="
                        color:#cbd5e1;
                        font-size:10px;
                        margin-top:8px;
                      "
                    >
                      Segurança • Monitoramento • Controle
                    </div>

                  </td>

                </tr>


              </table>


            </td>

          </tr>

        </table>

      </body>

    </html>
  `;
}


// =========================================================
// ENVIO BASE
// =========================================================

async function enviarEmail({
  destino,
  subject,
  html
}) {
  const transporter =
    criarTransporter();


  const attachments =
    [];


  if (
    logoExiste()
  ) {
    attachments.push({
      filename:
        "steel-icon.png",

      path:
        caminhoLogo,

      cid:
        "steelcontrol-logo"
    });
  }


  try {
    const info =
      await transporter.sendMail({
        from:
          env.emailFrom ||
          `SteelControl <${env.emailUser}>`,

        to:
          destino,

        subject,

        html,

        attachments
      });


    console.log(
      "E-mail SteelControl enviado:",
      info.messageId
    );


    return info;

  } catch (erroOriginal) {
    console.error(
      "Erro ao enviar e-mail pelo Gmail:",
      erroOriginal
    );


    const erro =
      new Error(
        "Não foi possível enviar o código por e-mail. Verifique a configuração do Gmail."
      );


    erro.statusCode =
      502;


    throw erro;
  }
}


// =========================================================
// ALTERAÇÃO DE E-MAIL
// =========================================================

export async function enviarCodigoAlteracaoEmail({
  destino,
  codigo,
  nome
}) {
  const html =
    criarTemplateEmail({
      titulo:
        "Confirme seu novo e-mail",

      subtitulo:
        "Proteção adicional para sua conta SteelControl",

      nome,

      codigo,

      mensagemPrincipal:
        "Recebemos uma solicitação para alterar o e-mail de acesso da sua conta SteelControl. Use o código abaixo para confirmar a alteração.",

      mensagemSecundaria:
        "O endereço de acesso só será alterado depois da confirmação deste código."
    });


  return enviarEmail({
    destino,

    subject:
      "SteelControl — confirme seu novo e-mail",

    html
  });
}


// =========================================================
// CADASTRO DA EMPRESA
// =========================================================

export async function enviarCodigoCadastroEmpresa({
  destino,
  codigo,
  nome,
  empresa
}) {
  const empresaSegura =
    String(
      empresa ||
      "sua empresa"
    );


  const html =
    criarTemplateEmail({
      titulo:
        "Confirme seu e-mail",

      subtitulo:
        "Finalize o cadastro da sua empresa no SteelControl",

      nome,

      codigo,

      mensagemPrincipal:
        `Recebemos uma solicitação para cadastrar a empresa ${empresaSegura} no SteelControl. Digite o código abaixo na tela de cadastro.`,

      mensagemSecundaria:
        "A empresa e o administrador só serão criados depois da confirmação deste código."
    });


  return enviarEmail({
    destino,

    subject:
      "SteelControl — código de confirmação",

    html
  });
}