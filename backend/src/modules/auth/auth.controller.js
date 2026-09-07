import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, randomInt } from "node:crypto";

import {
  prisma
} from "../../lib/prisma.js";

import {
  env
} from "../../config/env.js";


import {
  enviarCodigoCadastroEmpresa
} from "../../lib/mailer.js";

import {
  gerarEmbeddingPorImagem,
  analisarImagemFacial
} from "../../lib/faceApi.js";

import {
  validarMesmaPessoaLiveness,
  classificarCorrespondenciaFacial,
  encontrarCorrespondenciaFacial
} from "../../lib/faceSecurity.js";

import {
  criarAmostraFacialExclusiva
} from "../../lib/faceIdentity.js";

// =========================================================
// CONFIGURAÇÕES FACIAIS
// =========================================================

import { empresaParaResposta } from "../../lib/companyView.js";

const FACE_THRESHOLD = 0.58;
const FACE_MIN_MARGIN = 0.08;
const MAX_FACE_SAMPLES = 1;


// =========================================================
// CARGO PARA FRONTEND
// =========================================================

function cargoParaTela(cargo) {

  const cargos = {
    ADMINISTRADOR: "Administrador",
    SUPERVISOR: "Supervisor",
    TECNICO: "Técnico",
    OPERADOR: "Operador",
    VISITANTE: "Visitante"
  };

  return cargos[cargo] || cargo;
}


// =========================================================
// TOKEN
// =========================================================

function criarToken(usuario) {

  return jwt.sign(
    {
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      cargo: usuario.cargo
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}


// =========================================================
// VALIDAR EMBEDDING
// =========================================================

function embeddingValido(embedding) {

  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== 512) {
    return false;
  }

  return embedding.every(
    valor =>
      Number.isFinite(
        Number(valor)
      )
  );
}


// =========================================================
// NORMALIZAR VETOR
// =========================================================

function normalizar(vetor) {

  const numeros =
    vetor.map(Number);

  const norma =
    Math.sqrt(
      numeros.reduce(
        (soma, valor) =>
          soma + valor * valor,
        0
      )
    );

  if (!norma) {
    return null;
  }

  return numeros.map(
    valor =>
      valor / norma
  );
}


// =========================================================
// SIMILARIDADE COSSENO
// =========================================================

function similaridadeCosseno(
  vetorA,
  vetorB
) {

  const a =
    normalizar(vetorA);

  const b =
    normalizar(vetorB);

  if (
    !a ||
    !b ||
    a.length !== b.length
  ) {
    return -1;
  }

  let soma = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    soma += a[i] * b[i];
  }

  return soma;
}



// =========================================================
// VERIFICAÇÃO DE E-MAIL NO CADASTRO DA EMPRESA
// =========================================================

const CADASTRO_CODIGO_MINUTOS = 10;
const CADASTRO_MAX_TENTATIVAS = 5;
const CADASTRO_MAX_ENVIOS = 5;
const CADASTRO_REENVIO_SEGUNDOS = 60;
const CADASTRO_FACIAL_MINUTOS = 15;
const FACE_REGISTRATION_LOCK = 83472391;


const CADASTROS_PENDENTES =
  new Map();

const CADASTRO_HISTORICO_ENVIOS =
  new Map();

function limparHistoricoEnviosCadastro() {
  const limite =
    Date.now() -
    60 * 60 * 1000;

  for (
    const [email, timestamps]
    of CADASTRO_HISTORICO_ENVIOS.entries()
  ) {
    const recentes =
      timestamps.filter(
        timestamp =>
          timestamp > limite
      );

    if (recentes.length) {
      CADASTRO_HISTORICO_ENVIOS.set(
        email,
        recentes
      );
    } else {
      CADASTRO_HISTORICO_ENVIOS.delete(
        email
      );
    }
  }
}

function contarEnviosCadastroUltimaHora(
  email
) {
  limparHistoricoEnviosCadastro();

  return (
    CADASTRO_HISTORICO_ENVIOS
      .get(email) || []
  ).length;
}

function registrarEnvioCadastro(
  email
) {
  limparHistoricoEnviosCadastro();

  const atual =
    CADASTRO_HISTORICO_ENVIOS
      .get(email) || [];

  atual.push(Date.now());

  CADASTRO_HISTORICO_ENVIOS.set(
    email,
    atual
  );
}


function limparCadastrosPendentesExpirados() {
  const agora =
    Date.now();

  for (
    const [id, item]
    of CADASTROS_PENDENTES.entries()
  ) {
    const limiteAtual =
      item.emailConfirmado
        ? item.facialExpiraEm
        : item.expiraEm;

    const expirou =
      limiteAtual?.getTime?.() <=
      agora;

    const muitoAntigo =
      item.criadaEm?.getTime?.() <
      agora - 60 * 60 * 1000;

    if (
      item.usado ||
      expirou ||
      muitoAntigo
    ) {
      CADASTROS_PENDENTES.delete(id);
    }
  }
}


function encontrarCadastroPendentePorEmail(
  email
) {
  limparCadastrosPendentesExpirados();

  return [
    ...CADASTROS_PENDENTES.values()
  ]
    .filter(
      item =>
        item.email === email &&
        !item.usado
    )
    .sort(
      (a, b) =>
        b.ultimoEnvioEm.getTime() -
        a.ultimoEnvioEm.getTime()
    )[0] || null;
}




function somenteDigitosCnpj(
  valor
) {
  return String(valor || "")
    .replace(/\D/g, "");
}


function formatarCnpj(
  valor
) {
  const cnpj =
    somenteDigitosCnpj(valor);

  if (cnpj.length !== 14) {
    return "";
  }

  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}


function cnpjValido(
  valor
) {
  const cnpj =
    somenteDigitosCnpj(valor);

  if (
    cnpj.length !== 14 ||
    /^(\d)\1{13}$/.test(cnpj)
  ) {
    return false;
  }

  const calcularDigito =
    base => {
      let peso =
        base.length - 7;

      let soma = 0;

      for (
        const caractere
        of base
      ) {
        soma +=
          Number(caractere) *
          peso--;

        if (peso < 2) {
          peso = 9;
        }
      }

      const resto =
        soma % 11;

      return resto < 2
        ? 0
        : 11 - resto;
    };

  const base =
    cnpj.slice(0, 12);

  const digito1 =
    calcularDigito(base);

  const digito2 =
    calcularDigito(
      `${base}${digito1}`
    );

  return cnpj ===
    `${base}${digito1}${digito2}`;
}


function emailValido(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "")
      .trim()
      .toLowerCase()
  );
}


function gerarCodigoCadastro() {
  return String(
    randomInt(
      100000,
      1000000
    )
  );
}


function mascararEmail(
  email
) {
  const [
    usuario,
    dominio
  ] =
    String(email)
      .split("@");

  if (
    !usuario ||
    !dominio
  ) {
    return email;
  }

  const visivel =
    usuario.slice(
      0,
      Math.min(2, usuario.length)
    );

  const oculto =
    "*".repeat(
      Math.max(
        2,
        usuario.length -
        visivel.length
      )
    );

  return `${visivel}${oculto}@${dominio}`;
}


async function validarDisponibilidadeCadastro({
  email,
  cnpj
}) {
  const usuarioExiste =
    await prisma.usuario.findUnique({
      where: {
        email
      }
    });

  if (usuarioExiste) {
    const erro =
      new Error(
        "Este e-mail já está cadastrado."
      );

    erro.statusCode = 409;
    throw erro;
  }

  if (cnpj) {
    const empresaExiste =
      await prisma.empresa.findUnique({
        where: {
          cnpj
        }
      });

    if (empresaExiste) {
      const erro =
        new Error(
          "Este CNPJ já está cadastrado."
        );

      erro.statusCode = 409;
      throw erro;
    }
  }
}



export async function requestCompanyRegistrationCode(
  req,
  res,
  next
) {
  try {
    const {
      empresa,
      administrador
    } = req.body || {};

    const empresaNome =
      String(
        empresa?.nome || ""
      ).trim();

    const empresaCnpjInformado =
      String(
        empresa?.cnpj || ""
      ).trim();

    const empresaCnpj =
      formatarCnpj(
        empresaCnpjInformado
      );

    const adminNome =
      String(
        administrador?.nome || ""
      ).trim();

    const email =
      String(
        administrador?.email || ""
      )
        .trim()
        .toLowerCase();

    const senha =
      String(
        administrador?.senha || ""
      );

    if (
      !empresaNome ||
      !empresaCnpjInformado ||
      !adminNome ||
      !email ||
      !senha
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Preencha os dados obrigatórios da empresa, incluindo o CNPJ, e do administrador."
        });
    }

    if (
      !cnpjValido(
        empresaCnpjInformado
      )
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe um CNPJ válido."
        });
    }

    if (!emailValido(email)) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe um e-mail real e válido para receber o código de confirmação."
        });
    }

    if (senha.length < 8) {
      return res
        .status(400)
        .json({
          mensagem:
            "A senha deve possuir pelo menos 8 caracteres."
        });
    }

    await validarDisponibilidadeCadastro({
      email,
      cnpj: empresaCnpj
    });

    limparCadastrosPendentesExpirados();

    const tentativaRecente =
      encontrarCadastroPendentePorEmail(
        email
      );

    if (tentativaRecente) {
      const segundosDesde =
        Math.floor(
          (
            Date.now() -
            tentativaRecente
              .ultimoEnvioEm
              .getTime()
          ) / 1000
        );

      if (
        segundosDesde <
        CADASTRO_REENVIO_SEGUNDOS
      ) {
        const segundosRestantes =
          CADASTRO_REENVIO_SEGUNDOS -
          segundosDesde;

        return res
          .status(429)
          .json({
            mensagem:
              `Aguarde ${segundosRestantes} segundo(s) para solicitar outro código.`,
            aguardeSegundos:
              segundosRestantes
          });
      }
    }

    const enviosUltimaHora =
      contarEnviosCadastroUltimaHora(
        email
      );

    if (
      enviosUltimaHora >=
      CADASTRO_MAX_ENVIOS
    ) {
      return res
        .status(429)
        .json({
          mensagem:
            "Muitas solicitações de código para este e-mail. Tente novamente mais tarde."
        });
    }

    const codigo =
      gerarCodigoCadastro();

    const [
      codigoHash,
      senhaHash
    ] =
      await Promise.all([
        bcrypt.hash(codigo, 10),
        bcrypt.hash(senha, 12)
      ]);

    const agora =
      new Date();

    const expiraEm =
      new Date(
        Date.now() +
        CADASTRO_CODIGO_MINUTOS *
        60 *
        1000
      );

    for (
      const item
      of CADASTROS_PENDENTES.values()
    ) {
      if (
        item.email === email &&
        !item.usado
      ) {
        item.usado = true;
      }
    }

    const verificacao = {
      id:
        randomUUID(),
      empresaNome,
      empresaCnpj,
      adminNome,
      email,
      senhaHash,
      codigoHash,
      expiraEm,
      tentativas: 0,
      envios: 1,
      ultimoEnvioEm: agora,
      usado: false,
      emailConfirmado: false,
      emailConfirmadoEm: null,
      facialExpiraEm: null,
      criadaEm: agora
    };

    CADASTROS_PENDENTES.set(
      verificacao.id,
      verificacao
    );

    try {
      await enviarCodigoCadastroEmpresa({
        destino: email,
        codigo,
        nome: adminNome,
        empresa: empresaNome
      });

      registrarEnvioCadastro(
        email
      );
    } catch (erroEmail) {
      CADASTROS_PENDENTES.delete(
        verificacao.id
      );

      throw erroEmail;
    }

    return res.json({
      mensagem:
        "Enviamos um código de 6 dígitos para o e-mail informado. A conta ainda não foi criada.",
      verificacaoId:
        verificacao.id,
      email:
        mascararEmail(email),
      expiraEm:
        verificacao.expiraEm,
      aguardeReenvioSegundos:
        CADASTRO_REENVIO_SEGUNDOS
    });

  } catch (erro) {
    next(erro);
  }
}



export async function resendCompanyRegistrationCode(
  req,
  res,
  next
) {
  try {
    limparCadastrosPendentesExpirados();

    const verificacaoId =
      String(
        req.body?.verificacaoId || ""
      ).trim();

    const verificacao =
      CADASTROS_PENDENTES.get(
        verificacaoId
      );

    if (
      !verificacao ||
      verificacao.usado
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Este cadastro não está mais disponível para verificação."
        });
    }

    if (verificacao.emailConfirmado) {
      return res
        .status(409)
        .json({
          mensagem:
            "O e-mail já foi confirmado. Conclua a biometria facial para criar a conta."
        });
    }

    if (
      verificacao.envios >=
      CADASTRO_MAX_ENVIOS
    ) {
      return res
        .status(429)
        .json({
          mensagem:
            "Limite de reenvios atingido. Volte ao cadastro e solicite uma nova verificação."
        });
    }

    const segundosDesdeUltimoEnvio =
      Math.floor(
        (
          Date.now() -
          verificacao
            .ultimoEnvioEm
            .getTime()
        ) / 1000
      );

    if (
      segundosDesdeUltimoEnvio <
      CADASTRO_REENVIO_SEGUNDOS
    ) {
      const aguarde =
        CADASTRO_REENVIO_SEGUNDOS -
        segundosDesdeUltimoEnvio;

      return res
        .status(429)
        .json({
          mensagem:
            `Aguarde ${aguarde} segundo(s) para reenviar o código.`,
          aguardeSegundos:
            aguarde
        });
    }

    await validarDisponibilidadeCadastro({
      email: verificacao.email,
      cnpj: verificacao.empresaCnpj
    });

    if (
      contarEnviosCadastroUltimaHora(
        verificacao.email
      ) >= CADASTRO_MAX_ENVIOS
    ) {
      return res
        .status(429)
        .json({
          mensagem:
            "Limite de envios de código atingido para este e-mail. Tente novamente mais tarde."
        });
    }

    const codigo =
      gerarCodigoCadastro();

    const codigoHash =
      await bcrypt.hash(
        codigo,
        10
      );

    const expiraEm =
      new Date(
        Date.now() +
        CADASTRO_CODIGO_MINUTOS *
        60 *
        1000
      );

    await enviarCodigoCadastroEmpresa({
      destino:
        verificacao.email,
      codigo,
      nome:
        verificacao.adminNome,
      empresa:
        verificacao.empresaNome
    });

    registrarEnvioCadastro(
      verificacao.email
    );

    verificacao.codigoHash =
      codigoHash;

    verificacao.expiraEm =
      expiraEm;

    verificacao.tentativas =
      0;

    verificacao.envios +=
      1;

    verificacao.ultimoEnvioEm =
      new Date();

    return res.json({
      mensagem:
        "Novo código enviado com sucesso.",
      email:
        mascararEmail(
          verificacao.email
        ),
      expiraEm:
        verificacao.expiraEm,
      aguardeReenvioSegundos:
        CADASTRO_REENVIO_SEGUNDOS
    });

  } catch (erro) {
    next(erro);
  }
}



export async function confirmCompanyRegistrationCode(
  req,
  res,
  next
) {
  try {
    limparCadastrosPendentesExpirados();

    const verificacaoId =
      String(
        req.body?.verificacaoId || ""
      ).trim();

    const codigo =
      String(
        req.body?.codigo || ""
      ).trim();

    if (
      !verificacaoId ||
      !/^\d{6}$/.test(codigo)
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe o código de 6 dígitos enviado para seu e-mail."
        });
    }

    const verificacao =
      CADASTROS_PENDENTES.get(
        verificacaoId
      );

    if (
      !verificacao ||
      verificacao.usado
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Esta verificação de cadastro não é mais válida."
        });
    }

    // Se o e-mail já foi confirmado, não cria nada no banco ainda.
    // O cadastro só é finalizado após uma biometria facial válida.
    if (verificacao.emailConfirmado) {
      if (
        !verificacao.facialExpiraEm ||
        verificacao.facialExpiraEm <= new Date()
      ) {
        CADASTROS_PENDENTES.delete(
          verificacaoId
        );

        return res
          .status(400)
          .json({
            mensagem:
              "A etapa facial expirou. Inicie o cadastro novamente."
          });
      }

      return res.json({
        mensagem:
          "E-mail já confirmado. Conclua obrigatoriamente a biometria facial para criar a conta.",
        verificacaoId,
        contaCriada: false,
        proximaEtapa: "FACIAL",
        facialExpiraEm:
          verificacao.facialExpiraEm
      });
    }

    if (
      verificacao.expiraEm <=
      new Date()
    ) {
      CADASTROS_PENDENTES.delete(
        verificacaoId
      );

      return res
        .status(400)
        .json({
          mensagem:
            "O código expirou. Volte ao cadastro e solicite um novo código."
        });
    }

    if (
      verificacao.tentativas >=
      CADASTRO_MAX_TENTATIVAS
    ) {
      CADASTROS_PENDENTES.delete(
        verificacaoId
      );

      return res
        .status(429)
        .json({
          mensagem:
            "Limite de tentativas atingido. Solicite um novo código."
        });
    }

    const codigoValido =
      await bcrypt.compare(
        codigo,
        verificacao.codigoHash
      );

    if (!codigoValido) {
      verificacao.tentativas += 1;

      return res
        .status(400)
        .json({
          mensagem:
            `Código incorreto. Você ainda possui ${Math.max(0, CADASTRO_MAX_TENTATIVAS - verificacao.tentativas)} tentativa(s).`
        });
    }

    await validarDisponibilidadeCadastro({
      email:
        verificacao.email,
      cnpj:
        verificacao.empresaCnpj
    });

    const agora = new Date();

    verificacao.emailConfirmado =
      true;

    verificacao.emailConfirmadoEm =
      agora;

    verificacao.facialExpiraEm =
      new Date(
        agora.getTime() +
        CADASTRO_FACIAL_MINUTOS *
        60 *
        1000
      );

    // O código não pode ser reutilizado. Mantemos apenas os dados
    // temporários necessários para concluir a etapa biométrica.
    verificacao.codigoHash = null;
    verificacao.tentativas = 0;

    return res.json({
      mensagem:
        "E-mail confirmado. Agora conclua a biometria facial. A empresa e a conta ainda não foram criadas.",
      verificacaoId,
      contaCriada: false,
      proximaEtapa: "FACIAL",
      facialExpiraEm:
        verificacao.facialExpiraEm
    });

  } catch (erro) {
    next(erro);
  }
}


// =========================================================
// FINALIZAR CADASTRO DA EMPRESA COM BIOMETRIA OBRIGATÓRIA
// Empresa, administrador e FaceEmbedding são criados na MESMA
// transação. Se a facial falhar, nada é criado no PostgreSQL.
// =========================================================

export async function completeCompanyRegistrationWithFace(
  req,
  res,
  next
) {
  try {
    limparCadastrosPendentesExpirados();

    const verificacaoId =
      String(
        req.body?.verificacaoId || ""
      ).trim();

    const imagemFinal =
      req.files?.imagem?.[0];

    const imagemLiveness =
      req.files?.liveness?.[0];

    if (!verificacaoId) {
      return res
        .status(400)
        .json({
          mensagem:
            "Identificador do cadastro não informado."
        });
    }

    const verificacao =
      CADASTROS_PENDENTES.get(
        verificacaoId
      );

    if (
      !verificacao ||
      verificacao.usado ||
      !verificacao.emailConfirmado
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "O cadastro não está pronto para a etapa facial. Confirme o e-mail novamente."
        });
    }

    if (
      !verificacao.facialExpiraEm ||
      verificacao.facialExpiraEm <= new Date()
    ) {
      CADASTROS_PENDENTES.delete(
        verificacaoId
      );

      return res
        .status(400)
        .json({
          mensagem:
            "A etapa facial expirou. Inicie o cadastro novamente."
        });
    }

    if (
      !imagemFinal ||
      !imagemLiveness
    ) {
      return res
        .status(400)
        .json({
          codigo:
            "REGISTRATION_LIVENESS_REQUIRED",
          mensagem:
            "A biometria e a prova de vida são obrigatórias para criar a conta.",
          orientacao:
            "Olhe para a câmera, vire levemente a cabeça e volte para a posição frontal."
        });
    }

    const [
      analiseFinal,
      analiseLiveness
    ] = await Promise.all([
      analisarImagemFacial(
        imagemFinal
      ),
      analisarImagemFacial(
        imagemLiveness
      )
    ]);

    if (
      !analiseFinal?.detectado ||
      analiseFinal?.quantidadeRostos !== 1 ||
      analiseFinal?.pronto !== true
    ) {
      return res
        .status(422)
        .json({
          codigo:
            "REGISTRATION_FACE_NOT_READY",
          mensagem:
            analiseFinal?.orientacao ||
            "A imagem frontal não atingiu a qualidade necessária. Tente novamente.",
          repetirFacial: true
        });
    }

    const yaw =
      Number(
        analiseLiveness?.pose?.yaw
      );

    if (
      !analiseLiveness?.detectado ||
      analiseLiveness?.quantidadeRostos !== 1 ||
      !Number.isFinite(yaw) ||
      Math.abs(yaw) < 10
    ) {
      return res
        .status(422)
        .json({
          codigo:
            "REGISTRATION_LIVENESS_FAILED",
          mensagem:
            "A prova de vida não foi confirmada. Vire levemente a cabeça e tente novamente.",
          repetirFacial: true
        });
    }

    const [
      facialMovimento,
      facialFinal
    ] =
      await Promise.all([
        gerarEmbeddingPorImagem(
          imagemLiveness
        ),
        gerarEmbeddingPorImagem(
          imagemFinal
        )
      ]);

    if (
      !embeddingValido(
        facialMovimento?.embedding
      ) ||
      !embeddingValido(
        facialFinal?.embedding
      )
    ) {
      return res
        .status(422)
        .json({
          mensagem:
            "Não foi possível gerar uma biometria facial válida. Tente novamente.",
          repetirFacial: true
        });
    }

    const identidadeLiveness =
      validarMesmaPessoaLiveness({
        embeddingMovimento:
          facialMovimento.embedding,
        embeddingFinal:
          facialFinal.embedding,
        threshold:
          0.50
      });

    if (!identidadeLiveness.valida) {
      return res
        .status(422)
        .json({
          codigo:
            "REGISTRATION_LIVENESS_IDENTITY_MISMATCH",
          mensagem:
            "A prova de vida e a imagem final não pertencem à mesma pessoa. Refaça a facial sem sair da frente da câmera.",
          repetirFacial: true
        });
    }

    const resultado =
      await prisma.$transaction(
        async tx => {
          // Serializa a verificação de duplicidade + gravação facial.
          await tx.$queryRawUnsafe(
            `SELECT pg_advisory_xact_lock(${FACE_REGISTRATION_LOCK})::text AS "lock"`
          );

          const [
            usuarioExiste,
            empresaExiste,
            outrasFaces
          ] = await Promise.all([
            tx.usuario.findUnique({
              where: {
                email:
                  verificacao.email
              },
              select: {
                id: true
              }
            }),
            verificacao.empresaCnpj
              ? tx.empresa.findUnique({
                  where: {
                    cnpj:
                      verificacao.empresaCnpj
                  },
                  select: {
                    id: true
                  }
                })
              : Promise.resolve(null),
            tx.faceEmbedding.findMany({
              select: {
                id: true,
                usuarioId: true,
                embedding: true
              }
            })
          ]);

          if (usuarioExiste) {
            const erro =
              new Error(
                "Este e-mail já está cadastrado."
              );
            erro.statusCode = 409;
            throw erro;
          }

          if (empresaExiste) {
            const erro =
              new Error(
                "Este CNPJ já está cadastrado."
              );
            erro.statusCode = 409;
            throw erro;
          }

          const faceDuplicada =
            encontrarCorrespondenciaFacial({
              embedding:
                facialFinal.embedding,
              faces:
                outrasFaces,
              threshold:
                FACE_THRESHOLD
            });

          if (faceDuplicada) {
            const erro =
              new Error(
                "Este rosto já está vinculado a outro perfil. Use outra conta ou remova a biometria anterior."
              );
            erro.statusCode = 409;
            erro.codigo =
              "FACE_ALREADY_LINKED";
            throw erro;
          }

          const novaEmpresa =
            await tx.empresa.create({
              data: {
                nome:
                  verificacao.empresaNome,
                cnpj:
                  verificacao.empresaCnpj
              }
            });

          const usuario =
            await tx.usuario.create({
              data: {
                empresaId:
                  novaEmpresa.id,
                nome:
                  verificacao.adminNome,
                email:
                  verificacao.email,
                senhaHash:
                  verificacao.senhaHash,
                cargo:
                  "ADMINISTRADOR"
              }
            });

          const face =
            await tx.faceEmbedding.create({
              data: {
                usuarioId:
                  usuario.id,
                nome:
                  "Facial principal",
                embedding:
                  facialFinal.embedding,
                modelo:
                  "insightface-buffalo_l"
              }
            });

          return {
            novaEmpresa,
            usuario,
            face
          };
        },
        {
          maxWait: 5000,
          timeout: 15000
        }
      );

    verificacao.usado = true;
    CADASTROS_PENDENTES.delete(
      verificacaoId
    );

    return res
      .status(201)
      .json({
        mensagem:
          "Cadastro concluído com sucesso. E-mail e biometria facial confirmados.",
        token:
          criarToken(
            resultado.usuario
          ),
        usuario: {
          id:
            resultado.usuario.id,
          nome:
            resultado.usuario.nome,
          email:
            resultado.usuario.email,
          cargo:
            "Administrador"
        },
        empresa:
          empresaParaResposta(
            resultado.novaEmpresa
          ),
        facial: {
          cadastrada: true,
          faceId:
            resultado.face.id
        },
        cadastroConcluido: true
      });

  } catch (erro) {
    next(erro);
  }
}


export async function login(
  req,
  res,
  next
) {

  try {

    const {
      email,
      senha
    } = req.body;

    if (
      !email ||
      !senha
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "E-mail e senha são obrigatórios."
        });
    }

    const emailFormatado =
      email
        .trim()
        .toLowerCase();

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          email: emailFormatado
        },
        include: {
          empresa: true
        }
      });

    if (
      !usuario ||
      !usuario.ativo
    ) {

      return res
        .status(401)
        .json({
          mensagem:
            "E-mail ou senha inválidos."
        });
    }

    const senhaCorreta =
      await bcrypt.compare(
        senha,
        usuario.senhaHash
      );

    if (!senhaCorreta) {

      return res
        .status(401)
        .json({
          mensagem:
            "E-mail ou senha inválidos."
        });
    }

    return res.json({
      mensagem:
        "Login realizado com sucesso.",

      token:
        criarToken(usuario),

      usuario: {
        id:
          usuario.id,

        nome:
          usuario.nome,

        email:
          usuario.email,

        cargo:
          cargoParaTela(
            usuario.cargo
          )
      },

      empresa:
        empresaParaResposta(
          usuario.empresa
        )
    });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// CRIAR EMPRESA
// =========================================================

export async function registerCompany(
  req,
  res
) {
  return res
    .status(400)
    .json({
      codigo:
        "EMAIL_VERIFICACAO_OBRIGATORIA",
      mensagem:
        "Antes de criar a empresa, confirme o e-mail do administrador com o código enviado para o endereço informado."
    });
}


// =========================================================
// CADASTRO / LOGIN FACIAL POR IMAGEM
// O navegador envia a imagem. O Node consulta a Face API e
// somente o backend decide qual embedding será confiado.
// =========================================================

export async function analisarFaceImage(
  req,
  res,
  next
) {
  try {
    if (
      !req.file
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Imagem facial não recebida."
        });
    }

    const analise =
      await analisarImagemFacial(
        req.file
      );

    return res.json(
      analise
    );

  } catch (erro) {
    next(erro);
  }
}


export async function registerFaceImage(
  req,
  res,
  next
) {
  try {
    const facial =
      await gerarEmbeddingPorImagem(
        req.file
      );

    req.body = {
      ...(req.body || {}),
      embedding:
        facial.embedding
    };

    return registerFace(
      req,
      res,
      next
    );
  } catch (erro) {
    next(erro);
  }
}


export async function loginFaceImage(
  req,
  res,
  next
) {
  try {
    const imagemFinal =
      req.files?.imagem?.[0];

    const imagemLiveness =
      req.files?.liveness?.[0];

    if (
      !imagemFinal ||
      !imagemLiveness
    ) {
      return res
        .status(400)
        .json({
          codigo:
            "LIVENESS_REQUIRED",
          mensagem:
            "A prova de vida é obrigatória para o login facial.",
          orientacao:
            "Olhe para a câmera, mova levemente a cabeça e retorne para a posição frontal."
        });
    }

    const liveness =
      await analisarImagemFacial(
        imagemLiveness
      );

    const yaw =
      Number(
        liveness?.pose?.yaw
      );

    if (
      !liveness.detectado ||
      liveness.quantidadeRostos !== 1 ||
      !Number.isFinite(yaw) ||
      Math.abs(yaw) < 10
    ) {
      return res
        .status(401)
        .json({
          codigo:
            "LIVENESS_FAILED",
          mensagem:
            "A prova de vida não foi confirmada.",
          orientacao:
            "Vire levemente a cabeça para um dos lados e retorne para a câmera."
        });
    }

    /*
      Segurança adicional: o frame de movimento e o frame
      frontal final precisam pertencer à mesma identidade.
    */
    const [
      facialMovimento,
      facialFinal
    ] =
      await Promise.all([
        gerarEmbeddingPorImagem(
          imagemLiveness
        ),
        gerarEmbeddingPorImagem(
          imagemFinal
        )
      ]);

    const identidadeLiveness =
      validarMesmaPessoaLiveness({
        embeddingMovimento:
          facialMovimento.embedding,

        embeddingFinal:
          facialFinal.embedding,

        threshold:
          0.50
      });

    if (
      !identidadeLiveness.valida
    ) {
      return res
        .status(401)
        .json({
          codigo:
            "LIVENESS_IDENTITY_MISMATCH",
          mensagem:
            "A prova de vida e a imagem final não pertencem à mesma pessoa.",
          orientacao:
            "Refaça o reconhecimento sem sair da frente da câmera."
        });
    }

    req.body = {
      ...(req.body || {}),
      embedding:
        facialFinal.embedding,
      livenessSimilaridade:
        identidadeLiveness.similaridade
    };

    return loginFace(
      req,
      res,
      next
    );
  } catch (erro) {
    next(erro);
  }
}


// =========================================================
// CADASTRAR NOVA AMOSTRA FACIAL
// =========================================================

export async function registerFace(
  req,
  res,
  next
) {

  try {

    const {
      embedding,
      nomeFacial
    } = req.body;

    if (
      !embeddingValido(
        embedding
      )
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Embedding facial inválido."
        });
    }

    const usuarioId =
      req.auth.usuarioId;

    const usuario =
      await prisma.usuario.findFirst({
        where: {
          id:
            usuarioId,

          empresaId:
            req.auth.empresaId,

          ativo:
            true
        }
      });

    if (!usuario) {

      return res
        .status(404)
        .json({
          mensagem:
            "Usuário não encontrado."
        });
    }

    const registroFacial =
      await criarAmostraFacialExclusiva({
        prisma,
        usuarioId,
        embedding,
        nome:
          nomeFacial,
      });

    if (
      !registroFacial.ok &&
      registroFacial.motivo ===
        "perfil_ja_possui_face"
    ) {

      return res
          .status(409)
        .json({
          codigo:
            "FACE_PROFILE_ALREADY_REGISTERED",

          mensagem:
            "Seu perfil já possui uma biometria facial. Remova a facial atual antes de cadastrar outro rosto.",

          quantidade:
            registroFacial.quantidadeAtual,

          limite:
            MAX_FACE_SAMPLES
        });
    }

    if (
      !registroFacial.ok &&
      registroFacial.motivo ===
        "nome_duplicado"
    ) {

      return res
        .status(409)
        .json({
          codigo:
            "FACE_NAME_ALREADY_USED",

          mensagem:
            `Você já possui uma facial chamada "${registroFacial.nome}". Escolha outro nome.`
        });
    }

    if (
      !registroFacial.ok &&
      registroFacial.motivo ===
        "outro_perfil"
    ) {

      return res
        .status(409)
        .json({
          codigo:
            "FACE_ALREADY_LINKED",

          mensagem:
            "Este rosto já está vinculado a outro perfil. Remova a biometria do perfil anterior antes de cadastrá-la novamente."
        });
    }

    const rosto =
      registroFacial.face;

    const quantidade =
      registroFacial.quantidadeFaces;

    return res
      .status(201)
      .json({
        mensagem:
          "Reconhecimento facial único cadastrado com sucesso.",

        faceId:
          rosto.id,

        nomeFacial:
          rosto.nome,

        cadastrado:
          true,

        quantidade,

        limite:
          MAX_FACE_SAMPLES,

        restantes:
          MAX_FACE_SAMPLES -
          quantidade
      });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// LISTAR AMOSTRAS FACIAIS
// =========================================================

export async function listFaceSamples(
  req,
  res,
  next
) {

  try {

    const usuarioId =
      req.auth.usuarioId;

    const faces =
      await prisma.faceEmbedding.findMany({
        where: {
          usuarioId
        },

        orderBy: {
          criadoEm:
            "desc"
        },

        select: {
          id: true,
          nome: true,
          modelo: true,
          criadoEm: true
        }
      });

    return res.json({
      cadastrado:
        faces.length > 0,

      quantidade:
        faces.length,

      limite:
        MAX_FACE_SAMPLES,

      restantes:
        Math.max(
          0,
          MAX_FACE_SAMPLES -
          faces.length
        ),

      amostras:
        faces
    });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// REMOVER UMA AMOSTRA FACIAL
// =========================================================

export async function removeFaceSample(
  req,
  res,
  next
) {

  try {

    const usuarioId =
      req.auth.usuarioId;

    const faceId =
      Number(
        req.params.faceId
      );

    if (
      !Number.isInteger(faceId) ||
      faceId <= 0
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Identificador da facial inválido."
        });
    }

    const face =
      await prisma.faceEmbedding.findFirst({
        where: {
          id:
            faceId,

          usuarioId
        }
      });

    if (!face) {

      return res
        .status(404)
        .json({
          mensagem:
            "Amostra facial não encontrada."
        });
    }

    await prisma.faceEmbedding.delete({
      where: {
        id:
          faceId
      }
    });

    const quantidade =
      await prisma.faceEmbedding.count({
        where: {
          usuarioId
        }
      });

    return res.json({
      mensagem:
        "Amostra facial removida com sucesso.",

      cadastrado:
        quantidade > 0,

      quantidade,

      limite:
        MAX_FACE_SAMPLES,

      restantes:
        Math.max(
          0,
          MAX_FACE_SAMPLES -
          quantidade
        )
    });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// LOGIN FACIAL
// =========================================================

export async function loginFace(
  req,
  res,
  next
) {

  try {

    const {
      embedding
    } = req.body;

    if (
      !embeddingValido(
        embedding
      )
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Dados faciais inválidos."
        });
    }

    const faces =
      await prisma.faceEmbedding.findMany({
        where: {
          usuario: {
            ativo:
              true
          }
        },

        include: {
          usuario: {
            include: {
              empresa:
                true
            }
          }
        }
      });

    if (
      faces.length === 0
    ) {

      return res
        .status(401)
        .json({
          codigo:
            "FACE_NOT_REGISTERED",

          mensagem:
            "Nenhum reconhecimento facial está cadastrado no sistema."
        });
    }

    const classificacao =
      classificarCorrespondenciaFacial({
        embedding,
        faces,
        threshold:
          FACE_THRESHOLD,
        margemMinima:
          FACE_MIN_MARGIN
      });

    if (
      classificacao.status ===
      "nao_encontrado"
    ) {

      return res
        .status(401)
        .json({
          codigo:
            "FACE_NOT_REGISTERED",

          mensagem:
            "Rosto não cadastrado ou não reconhecido.",

          orientacao:
            "Entre com seu e-mail e senha ou cadastre seu rosto."
        });
    }

    if (
      classificacao.status ===
      "ambiguo"
    ) {

      return res
        .status(401)
        .json({
          codigo:
            "FACE_AMBIGUOUS",

          mensagem:
            "Não foi possível confirmar sua identidade com segurança.",

          orientacao:
            "Olhe diretamente para a câmera e tente novamente."
        });
    }

    const melhor =
      classificacao.melhor;

    const usuario =
      melhor.usuario;

    return res.json({
      mensagem:
        `Rosto reconhecido. Bem-vindo, ${usuario.nome}!`,

      token:
        criarToken(
          usuario
        ),

      usuario: {
        id:
          usuario.id,

        nome:
          usuario.nome,

        email:
          usuario.email,

        cargo:
          cargoParaTela(
            usuario.cargo
          )
      },

      empresa:
        empresaParaResposta(
          usuario.empresa
        ),

      reconhecimento: {
        similaridade:
          Number(
            melhor.similaridade.toFixed(4)
          ),

        margem:
          Number(
            classificacao.margem.toFixed(4)
          ),

        faceId:
          melhor.faceId
      }
    });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// STATUS FACIAL
// =========================================================

export async function faceStatus(
  req,
  res,
  next
) {

  try {

    const usuarioId =
      req.auth.usuarioId;

    const quantidade =
      await prisma.faceEmbedding.count({
        where: {
          usuarioId
        }
      });

    return res.json({
      cadastrado:
        quantidade > 0,

      quantidade,

      limite:
        MAX_FACE_SAMPLES,

      restantes:
        Math.max(
          0,
          MAX_FACE_SAMPLES -
          quantidade
        )
    });

  } catch (erro) {

    next(erro);
  }
}


// =========================================================
// REMOVER TODAS AS FACIAIS
// =========================================================

export async function removeFace(
  req,
  res,
  next
) {

  try {

    const usuarioId =
      req.auth.usuarioId;

    const resultado =
      await prisma.faceEmbedding.deleteMany({
        where: {
          usuarioId
        }
      });

    return res.json({
      mensagem:
        "Reconhecimento facial removido com sucesso.",

      removidas:
        resultado.count,

      cadastrado:
        false,

      quantidade:
        0,

      limite:
        MAX_FACE_SAMPLES,

      restantes:
        MAX_FACE_SAMPLES
    });

  } catch (erro) {

    next(erro);
  }
}
