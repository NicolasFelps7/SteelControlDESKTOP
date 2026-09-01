import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";


const TROCAS_EMAIL_PENDENTES =
  new Map();

const TROCA_EMAIL_MAX_TENTATIVAS = 5;
const TROCA_EMAIL_REENVIO_SEGUNDOS = 60;


function limparTrocasEmailExpiradas() {
  const agora =
    Date.now();

  for (
    const [usuarioId, item]
    of TROCAS_EMAIL_PENDENTES.entries()
  ) {
    if (
      !item ||
      item.expiraEm.getTime() <= agora
    ) {
      TROCAS_EMAIL_PENDENTES.delete(
        usuarioId
      );
    }
  }
}


import {
  prisma
} from "../../lib/prisma.js";

import {
  enviarCodigoAlteracaoEmail
} from "../../lib/mailer.js";

import {
  gerarEmbeddingPorImagem
} from "../../lib/faceApi.js";

import {
  criarAmostraFacialExclusiva
} from "../../lib/faceIdentity.js";

import {
  registrarAuditoria
} from "../../lib/audit.js";

import {
  empresaParaResposta
} from "../../lib/companyView.js";


const MAX_FACE_SAMPLES = 1;


// =========================================================
// VERIFICAR ADMINISTRADOR
// =========================================================

function ehAdministrador(req) {

  return (
    req.auth?.cargo ===
    "ADMINISTRADOR"
  );

}


// =========================================================
// FORMATAR CARGO
// =========================================================

function cargoParaTela(cargo) {

  const cargos = {

    ADMINISTRADOR:
      "Administrador",

    SUPERVISOR:
      "Supervisor",

    TECNICO:
      "Técnico",

    OPERADOR:
      "Operador",

    VISITANTE:
      "Visitante"

  };


  return (
    cargos[cargo] ||
    cargo
  );

}


// =========================================================
// VALIDAR EMBEDDING
// =========================================================

function embeddingValido(
  embedding
) {

  if (
    !Array.isArray(
      embedding
    )
  ) {

    return false;

  }


  if (
    embedding.length !==
    512
  ) {

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
// LIMPAR TEXTO OPCIONAL
// =========================================================

function textoOpcional(
  valor
) {

  if (
    typeof valor !==
    "string"
  ) {

    return null;

  }


  const texto =
    valor.trim();


  return (
    texto ||
    null
  );

}




function somenteDigitos(
  valor
) {
  return String(valor || "")
    .replace(/\D/g, "");
}


function formatarCnpjEmpresa(
  valor
) {
  const digitos =
    somenteDigitos(valor);

  if (
    digitos.length !== 14
  ) {
    return "";
  }

  return digitos.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}


function cnpjEmpresaValido(
  valor
) {
  const cnpj =
    somenteDigitos(valor);

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

      for (const numero of base) {
        soma +=
          Number(numero) *
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

  const d1 =
    calcularDigito(base);

  const d2 =
    calcularDigito(
      `${base}${d1}`
    );

  return cnpj ===
    `${base}${d1}${d2}`;
}


function formatarTelefoneEmpresa(
  valor
) {
  const numero =
    somenteDigitos(valor)
      .slice(0, 11);

  if (
    numero.length === 11
  ) {
    return numero.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (
    numero.length === 10
  ) {
    return numero.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return String(valor || "")
    .trim();
}


function formatarCepEmpresa(
  valor
) {
  const numero =
    somenteDigitos(valor)
      .slice(0, 8);

  if (
    numero.length === 8
  ) {
    return numero.replace(
      /^(\d{5})(\d{3})$/,
      "$1-$2"
    );
  }

  return String(valor || "")
    .trim();
}


// =========================================================
// BUSCAR EMPRESA
// GET /empresa/me
// =========================================================

export async function getEmpresa(
  req,
  res,
  next
) {

  try {

    const empresa =
      await prisma.empresa.findUnique({

        where: {

          id:
            req.auth.empresaId

        }

      });


    if (!empresa) {

      return res
        .status(404)
        .json({

          mensagem:
            "Empresa não encontrada."

        });

    }


    return res.json(
      empresaParaResposta(
        empresa
      )
    );


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// ALTERAR DADOS DA EMPRESA
// PUT /empresa/me
// =========================================================

export async function atualizarEmpresa(
  req,
  res,
  next
) {

  try {

    // =====================================================
    // PERMISSÃO
    // =====================================================

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem alterar os dados da empresa."

        });

    }


    // =====================================================
    // DADOS
    // =====================================================

    const {

      nome,
      cnpj,

      telefone,
      email,
      site,

      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais

    } = req.body;


    // =====================================================
    // VALIDAR NOME
    // =====================================================

    if (
      !nome?.trim()
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "O nome da empresa é obrigatório."

        });

    }


    // =====================================================
    // CNPJ
    // =====================================================

    const cnpjInformado =
      String(
        cnpj || ""
      ).trim();

    if (
      !cnpjInformado
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "O CNPJ da empresa é obrigatório."
        });
    }


    if (
      !cnpjEmpresaValido(
        cnpjInformado
      )
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe um CNPJ válido."
        });
    }


    const cnpjFormatado =
      formatarCnpjEmpresa(
        cnpjInformado
      );


    if (
      cnpjFormatado
    ) {

      const empresaMesmoCnpj =
        await prisma.empresa.findFirst({

          where: {

            cnpj:
              cnpjFormatado,

            NOT: {

              id:
                req.auth.empresaId

            }

          }

        });


      if (
        empresaMesmoCnpj
      ) {

        return res
          .status(409)
          .json({

            mensagem:
              "Este CNPJ já pertence a outra empresa."

          });

      }

    }


    // =====================================================
    // ESTADO
    // =====================================================

    const estadoFormatado =
      textoOpcional(
        estado
      )
        ?.toUpperCase() ||
      null;


    if (
      estadoFormatado &&
      estadoFormatado.length !==
      2
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Informe o estado utilizando a sigla com 2 letras."

        });

    }


    // =====================================================
    // EMAIL
    // =====================================================

    const emailFormatado =
      textoOpcional(
        email
      )
        ?.toLowerCase() ||
      null;


    // =====================================================
    // ATUALIZAR
    // =====================================================

    const empresa =
      await prisma.empresa.update({

        where: {

          id:
            req.auth.empresaId

        },


        data: {

          nome:
            nome.trim(),

          cnpj:
            cnpjFormatado,

          telefone:
            telefone
              ? formatarTelefoneEmpresa(
                  telefone
                )
              : null,

          email:
            emailFormatado,

          site:
            textoOpcional(
              site
            ),

          cep:
            cep
              ? formatarCepEmpresa(
                  cep
                )
              : null,

          endereco:
            textoOpcional(
              endereco
            ),

          numero:
            textoOpcional(
              numero
            ),

          complemento:
            textoOpcional(
              complemento
            ),

          bairro:
            textoOpcional(
              bairro
            ),

          cidade:
            textoOpcional(
              cidade
            ),

          estado:
            estadoFormatado,

          pais:
            textoOpcional(
              pais
            ) ||
            "Brasil"

        }

      });


    return res.json({

      mensagem:
        "Dados da empresa atualizados com sucesso.",

      empresa:
        empresaParaResposta(
          empresa
        )

    });


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// LOGO PÚBLICA
// GET /empresa/logo/:empresaId
// =========================================================

export async function obterLogoPublica(
  req,
  res,
  next
) {
  try {
    const empresaId =
      Number(
        req.params.empresaId
      );

    if (
      !Number.isInteger(empresaId) ||
      empresaId <= 0
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Empresa inválida."
        });
    }

    const empresa =
      await prisma.empresa.findUnique({
        where: {
          id:
            empresaId
        },
        select: {
          logoData:
            true,
          logoMime:
            true
        }
      });

    if (
      !empresa?.logoData ||
      !empresa.logoMime
    ) {
      return res
        .status(404)
        .end();
    }

    res.setHeader(
      "Content-Type",
      empresa.logoMime
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, max-age=0, must-revalidate"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    // Compatibilidade segura para clientes móveis e versões antigas que
    // carreguem a imagem por outra origem. A rota contém apenas a logo pública.
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    return res.send(
      Buffer.from(
        empresa.logoData
      )
    );

  } catch (erro) {
    next(erro);
  }
}


// =========================================================
// ALTERAR LOGO
// POST /empresa/logo
// =========================================================

export async function uploadLogo(
  req,
  res,
  next
) {
  try {
    if (
      !ehAdministrador(req)
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            "Somente administradores podem alterar a logo."
        });
    }

    if (
      !req.file?.buffer
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Selecione uma imagem."
        });
    }

    const mime =
      String(
        req.file.mimetype || ""
      ).trim();

    const logoUrl =
      `/empresa/logo/${req.auth.empresaId}?v=${Date.now()}`;

    const empresa =
      await prisma.empresa.update({
        where: {
          id:
            req.auth.empresaId
        },
        data: {
          logoUrl,
          logoData:
            req.file.buffer,
          logoMime:
            mime
        }
      });

    if (
      !empresa.logoData?.length ||
      empresa.logoMime !== mime
    ) {
      const erroPersistencia =
        new Error(
          "A logo não foi confirmada no PostgreSQL. Tente novamente."
        );
      erroPersistencia.status = 500;
      throw erroPersistencia;
    }

    await registrarAuditoria({
      req,
      acao:
        "ALTERAR_LOGO",
      entidade:
        "EMPRESA",
      entidadeId:
        empresa.id,
      detalhes: {
        mime,
        bytes:
          req.file.buffer.length
      }
    });

    return res.json({
      mensagem:
        "Logo atualizada com sucesso.",
      empresa:
        empresaParaResposta(
          empresa
        )
    });

  } catch (erro) {
    next(erro);
  }
}




// =========================================================
// REMOVER LOGO
// DELETE /empresa/logo
// =========================================================

export async function removerLogo(
  req,
  res,
  next
) {
  try {
    if (
      !ehAdministrador(req)
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            "Somente administradores podem remover a logo."
        });
    }

    const empresa =
      await prisma.empresa.findUnique({
        where: {
          id:
            req.auth.empresaId
        },
        select: {
          id:
            true,
          nome:
            true,
          logoUrl:
            true
        }
      });

    if (!empresa) {
      return res
        .status(404)
        .json({
          mensagem:
            "Empresa não encontrada."
        });
    }

    const atualizada =
      await prisma.empresa.update({
        where: {
          id:
            req.auth.empresaId
        },
        data: {
          logoUrl:
            null,
          logoData:
            null,
          logoMime:
            null
        }
      });

    await registrarAuditoria({
      req,
      acao:
        "REMOVER_LOGO",
      entidade:
        "EMPRESA",
      entidadeId:
        empresa.id,
      detalhes: {
        empresa:
          empresa.nome,
        logoAnterior:
          empresa.logoUrl
      }
    });

    return res.json({
      mensagem:
        "Logo removida com sucesso. A identidade padrão do SteelControl foi restaurada.",
      empresa:
        empresaParaResposta(
          atualizada
        )
    });

  } catch (erro) {
    next(erro);
  }
}


// =========================================================
// LISTAR FUNCIONÁRIOS
// GET /empresa/usuarios
// =========================================================

export async function listarUsuarios(
  req,
  res,
  next
) {

  try {

    const usuarios =
      await prisma.usuario.findMany({

        where: {

          empresaId:
            req.auth.empresaId,

          ativo:
            true

        },


        orderBy: {

          nome:
            "asc"

        },


        include: {

          _count: {

            select: {

              faces:
                true

            }

          }

        }

      });


    const resultado =
      usuarios.map(
        usuario => ({

          id:
            usuario.id,

          nome:
            usuario.nome,

          email:
            usuario.email,

          cargo:
            usuario.cargo,

          cargoTela:
            cargoParaTela(
              usuario.cargo
            ),

          ativo:
            usuario.ativo,

          quantidadeFaces:
            usuario._count.faces,

          facialCadastrada:
            usuario._count.faces > 0,

          limiteFaces:
            MAX_FACE_SAMPLES

        })
      );


    return res.json(
      resultado
    );


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// CRIAR FUNCIONÁRIO
// POST /empresa/usuarios
// =========================================================

export async function criarUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem cadastrar funcionários."

        });

    }


    const {

      nome,
      email,
      senha,
      cargo

    } = req.body;


    if (
      !nome?.trim() ||
      !email?.trim() ||
      !senha ||
      !cargo
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Preencha nome, e-mail, senha e cargo."

        });

    }


    if (
      String(senha).length <
      8
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "A senha deve possuir pelo menos 8 caracteres."

        });

    }


    const cargosPermitidos = [

      "ADMINISTRADOR",
      "SUPERVISOR",
      "TECNICO",
      "OPERADOR",
      "VISITANTE"

    ];


    if (
      !cargosPermitidos.includes(
        cargo
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Cargo inválido."

        });

    }


    const emailFormatado =
      String(email)
        .trim()
        .toLowerCase();


    const usuarioExiste =
      await prisma.usuario.findUnique({

        where: {

          email:
            emailFormatado

        }

      });


    /*
      Se o e-mail pertence a uma conta ATIVA, continua sendo
      duplicidade normal.

      Se a conta está INATIVA e pertence à MESMA empresa,
      tratamos como recontratação/reativação. Isso evita criar
      registros duplicados e preserva toda a rastreabilidade
      histórica do funcionário.
    */

    if (
      usuarioExiste &&
      usuarioExiste.ativo
    ) {

      return res
        .status(409)
        .json({

          mensagem:
            "Este e-mail já está cadastrado e ativo."

        });

    }


    if (
      usuarioExiste &&
      usuarioExiste.empresaId !==
      req.auth.empresaId
    ) {

      return res
        .status(409)
        .json({

          mensagem:
            "Este e-mail já está vinculado a outra empresa."

        });

    }


    const senhaHash =
      await bcrypt.hash(
        String(senha),
        12
      );


    if (
      usuarioExiste &&
      !usuarioExiste.ativo
    ) {

      const usuarioReativado =
        await prisma.$transaction(
          async tx => {

            /*
              Por segurança/LGPD, uma recontratação não reutiliza
              automaticamente a biometria antiga. O funcionário
              deverá cadastrar a facial novamente.
            */

            await tx.faceEmbedding.deleteMany({

              where: {

                usuarioId:
                  usuarioExiste.id

              }

            });


            return tx.usuario.update({

              where: {

                id:
                  usuarioExiste.id

              },

              data: {

                nome:
                  nome.trim(),

                senhaHash,

                cargo,

                ativo:
                  true

              }

            });

          }
        );


      await registrarAuditoria({

        req,

        acao:
          "REATIVAR",

        entidade:
          "USUARIO",

        entidadeId:
          usuarioReativado.id,

        detalhes: {

          nome:
            usuarioReativado.nome,

          email:
            usuarioReativado.email,

          cargo:
            usuarioReativado.cargo,

          motivo:
            "Recontratação de funcionário previamente desativado",

          facial:
            "Amostras anteriores removidas; novo cadastro biométrico necessário"

        }

      });


      return res
        .status(200)
        .json({

          mensagem:
            "Funcionário reativado com sucesso. Cadastre a facial novamente.",

          reativado:
            true,

          usuario: {

            id:
              usuarioReativado.id,

            nome:
              usuarioReativado.nome,

            email:
              usuarioReativado.email,

            cargo:
              usuarioReativado.cargo,

            cargoTela:
              cargoParaTela(
                usuarioReativado.cargo
              ),

            ativo:
              true,

            quantidadeFaces:
              0,

            facialCadastrada:
              false

          }

        });

    }


    const usuario =
      await prisma.usuario.create({

        data: {

          empresaId:
            req.auth.empresaId,

          nome:
            nome.trim(),

          email:
            emailFormatado,

          senhaHash,

          cargo,

          ativo:
            true

        }

      });


    await registrarAuditoria({

      req,

      acao:
        "CRIAR",

      entidade:
        "USUARIO",

      entidadeId:
        usuario.id,

      detalhes: {

        nome:
          usuario.nome,

        email:
          usuario.email,

        cargo:
          usuario.cargo

      }

    });


    return res
      .status(201)
      .json({

        mensagem:
          "Funcionário cadastrado com sucesso.",

        reativado:
          false,

        usuario: {

          id:
            usuario.id,

          nome:
            usuario.nome,

          email:
            usuario.email,

          cargo:
            usuario.cargo,

          cargoTela:
            cargoParaTela(
              usuario.cargo
            ),

          ativo:
            true,

          quantidadeFaces:
            0,

          facialCadastrada:
            false

        }

      });


  } catch (erro) {

    next(erro);

  }

}




// =========================================================
// ATUALIZAR FUNCIONÁRIO
// PUT /empresa/usuarios/:usuarioId
// =========================================================

export async function atualizarUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({
          mensagem:
            "Somente administradores podem alterar funcionários."
        });

    }


    const usuarioId =
      Number(
        req.params.usuarioId
      );


    if (
      !Number.isInteger(
        usuarioId
      )
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Funcionário inválido."
        });

    }


    const usuario =
      await prisma.usuario.findFirst({

        where: {
          id:
            usuarioId,

          empresaId:
            req.auth.empresaId
        }

      });


    if (!usuario) {

      return res
        .status(404)
        .json({
          mensagem:
            "Funcionário não encontrado."
        });

    }


    const {
      nome,
      email,
      senha,
      cargo,
      ativo
    } = req.body;


    const cargosPermitidos = [
      "ADMINISTRADOR",
      "SUPERVISOR",
      "TECNICO",
      "OPERADOR",
      "VISITANTE"
    ];


    if (
      cargo &&
      !cargosPermitidos.includes(
        cargo
      )
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Cargo inválido."
        });

    }


    const alterandoPropriaConta =
      usuarioId ===
      req.auth.usuarioId;


    if (
      alterandoPropriaConta &&
      cargo &&
      cargo !==
      "ADMINISTRADOR"
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "O administrador conectado não pode remover o próprio cargo de administrador."
        });

    }


    if (
      alterandoPropriaConta &&
      ativo ===
      false
    ) {

      return res
        .status(400)
        .json({
          mensagem:
            "Você não pode desativar sua própria conta enquanto estiver conectado."
        });

    }


    const data = {};


    if (
      nome?.trim()
    ) {

      data.nome =
        nome.trim();

    }


    if (cargo) {

      data.cargo =
        cargo;

    }


    if (
      typeof ativo ===
      "boolean"
    ) {

      data.ativo =
        ativo;

    }


    if (
      email !==
      undefined
    ) {

      const emailFormatado =
        String(email)
          .trim()
          .toLowerCase();


      if (!emailFormatado) {

        return res
          .status(400)
          .json({
            mensagem:
              "Informe um e-mail válido."
          });

      }


      if (
        emailFormatado !==
        usuario.email
      ) {

        const usuarioMesmoEmail =
          await prisma.usuario.findUnique({
            where: {
              email:
                emailFormatado
            }
          });


        if (
          usuarioMesmoEmail &&
          usuarioMesmoEmail.id !==
          usuario.id
        ) {

          return res
            .status(409)
            .json({
              mensagem:
                "Este e-mail já está cadastrado."
            });

        }


        if (
          alterandoPropriaConta
        ) {

          return res
            .status(409)
            .json({
              codigo:
                "EMAIL_VERIFICACAO_NECESSARIA",
              mensagem:
                "Para alterar o seu próprio e-mail, solicite o código de verificação enviado ao novo endereço."
            });

        }


        data.email =
          emailFormatado;

      }

    }


    if (
      senha !==
      undefined &&
      String(senha).length > 0
    ) {

      if (
        String(senha).length <
        8
      ) {

        return res
          .status(400)
          .json({
            mensagem:
              "A nova senha deve possuir pelo menos 8 caracteres."
          });

      }


      data.senhaHash =
        await bcrypt.hash(
          String(senha),
          12
        );

    }


    const atualizado =
      await prisma.usuario.update({

        where: {
          id:
            usuarioId
        },

        data

      });


    await registrarAuditoria({
      req,
      acao: "ATUALIZAR",
      entidade: "USUARIO",
      entidadeId: usuarioId,
      detalhes: {
        campos: Object.keys(data)
      }
    });


    return res.json({

      mensagem:
        "Funcionário atualizado com sucesso.",

      usuario: {
        id:
          atualizado.id,

        nome:
          atualizado.nome,

        email:
          atualizado.email,

        cargo:
          atualizado.cargo,

        cargoTela:
          cargoParaTela(
            atualizado.cargo
          ),

        ativo:
          atualizado.ativo
      }

    });


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// DESATIVAR FUNCIONÁRIO
// DELETE /empresa/usuarios/:usuarioId
// =========================================================

export async function removerUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem desativar funcionários."

        });

    }


    const usuarioId =
      Number(
        req.params.usuarioId
      );


    if (
      !Number.isInteger(
        usuarioId
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Funcionário inválido."

        });

    }


    if (
      usuarioId ===
      req.auth.usuarioId
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Você não pode desativar sua própria conta enquanto estiver conectado."

        });

    }


    const usuario =
      await prisma.usuario.findFirst({

        where: {

          id:
            usuarioId,

          empresaId:
            req.auth.empresaId

        }

      });


    if (!usuario) {

      return res
        .status(404)
        .json({

          mensagem:
            "Funcionário não encontrado."

        });

    }


    if (
      !usuario.ativo
    ) {

      return res.json({

        mensagem:
          "Este funcionário já está desativado."

      });

    }


    await prisma.$transaction(
      async tx => {

        await tx.usuario.update({

          where: {

            id:
              usuarioId

          },

          data: {

            ativo:
              false

          }

        });


        /*
          A conta continua no banco para preservar histórico e
          auditoria, mas as credenciais biométricas são revogadas.
        */

        await tx.faceEmbedding.deleteMany({

          where: {

            usuarioId

          }

        });

      }
    );


    await registrarAuditoria({

      req,

      acao:
        "DESATIVAR",

      entidade:
        "USUARIO",

      entidadeId:
        usuarioId,

      detalhes: {

        nome:
          usuario.nome,

        email:
          usuario.email,

        acesso:
          "Conta desativada",

        facial:
          "Amostras biométricas revogadas"

      }

    });


    return res.json({

      mensagem:
        "Funcionário desativado com sucesso. O acesso e a biometria facial foram revogados."

    });


  } catch (erro) {

    next(erro);

  }

}



// =========================================================
// CADASTRAR FACIAL POR IMAGEM (RECOMENDADO)
// =========================================================

export async function cadastrarFaceUsuarioImagem(
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

    return cadastrarFaceUsuario(
      req,
      res,
      next
    );
  } catch (erro) {
    next(erro);
  }
}


// =========================================================
// CADASTRAR FACIAL
// POST /empresa/usuarios/:usuarioId/face
// =========================================================

export async function cadastrarFaceUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem cadastrar faciais de funcionários."

        });

    }


    const usuarioId =
      Number(
        req.params.usuarioId
      );


    if (
      !Number.isInteger(
        usuarioId
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Funcionário inválido."

        });

    }


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
            "Funcionário não encontrado nesta empresa."

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
            "Este perfil já possui uma biometria facial. Remova a facial atual antes de cadastrar outro rosto.",

          quantidadeFaces:
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
            `Já existe uma facial chamada "${registroFacial.nome}" neste perfil. Escolha outro nome.`

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


    const face =
      registroFacial.face;


    const quantidadeFaces =
      registroFacial.quantidadeFaces;


    return res
      .status(201)
      .json({

        mensagem:
          "Reconhecimento facial único cadastrado com sucesso.",

        faceId:
          face.id,

        nomeFacial:
          face.nome,

        quantidadeFaces,

        limite:
          MAX_FACE_SAMPLES,

        restantes:
          MAX_FACE_SAMPLES -
          quantidadeFaces

      });


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// LISTAR FACIAIS
// GET /empresa/usuarios/:usuarioId/faces
// =========================================================

export async function listarFacesUsuario(
  req,
  res,
  next
) {

  try {

    const usuarioId =
      Number(
        req.params.usuarioId
      );


    if (
      !Number.isInteger(
        usuarioId
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Funcionário inválido."

        });

    }


    const usuario =
      await prisma.usuario.findFirst({

        where: {

          id:
            usuarioId,

          empresaId:
            req.auth.empresaId

        }

      });


    if (!usuario) {

      return res
        .status(404)
        .json({

          mensagem:
            "Funcionário não encontrado."

        });

    }


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

          id:
            true,

          nome:
            true,

          modelo:
            true,

          criadoEm:
            true

        }

      });


    return res.json({

      usuario: {

        id:
          usuario.id,

        nome:
          usuario.nome

      },

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

      faciais:
        faces

    });


  } catch (erro) {

    next(erro);

  }

}


// =========================================================
// REMOVER UMA FACIAL
// DELETE /empresa/usuarios/:usuarioId/faces/:faceId
// =========================================================

export async function removerFaceUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem remover faciais."

        });

    }


    const usuarioId =
      Number(
        req.params.usuarioId
      );


    const faceId =
      Number(
        req.params.faceId
      );


    if (
      !Number.isInteger(
        usuarioId
      ) ||
      !Number.isInteger(
        faceId
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Dados da facial inválidos."

        });

    }


    const usuario =
      await prisma.usuario.findFirst({

        where: {

          id:
            usuarioId,

          empresaId:
            req.auth.empresaId

        }

      });


    if (!usuario) {

      return res
        .status(404)
        .json({

          mensagem:
            "Funcionário não encontrado."

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
        `Facial "${face.nome}" removida com sucesso.`,

      removida: {
        id:
          face.id,
        nome:
          face.nome
      },

      quantidade,

      cadastrado:
        quantidade > 0,

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
// DELETE /empresa/usuarios/:usuarioId/face
// =========================================================

export async function removerFacesUsuario(
  req,
  res,
  next
) {

  try {

    if (
      !ehAdministrador(req)
    ) {

      return res
        .status(403)
        .json({

          mensagem:
            "Somente administradores podem remover faciais."

        });

    }


    const usuarioId =
      Number(
        req.params.usuarioId
      );


    if (
      !Number.isInteger(
        usuarioId
      )
    ) {

      return res
        .status(400)
        .json({

          mensagem:
            "Funcionário inválido."

        });

    }


    const usuario =
      await prisma.usuario.findFirst({

        where: {

          id:
            usuarioId,

          empresaId:
            req.auth.empresaId

        }

      });


    if (!usuario) {

      return res
        .status(404)
        .json({

          mensagem:
            "Funcionário não encontrado."

        });

    }


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

      quantidade:
        0,

      cadastrado:
        false,

      limite:
        MAX_FACE_SAMPLES,

      restantes:
        MAX_FACE_SAMPLES

    });


  } catch (erro) {

    next(erro);

  }

}

// =========================================================
// SOLICITAR CÓDIGO PARA ALTERAR O PRÓPRIO E-MAIL
// =========================================================


export async function solicitarCodigoAlteracaoEmail(
  req,
  res,
  next
) {
  try {
    if (!ehAdministrador(req)) {
      return res
        .status(403)
        .json({
          mensagem:
            "Somente administradores podem solicitar esta alteração."
        });
    }

    const usuarioId =
      Number(
        req.params.usuarioId
      );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId !==
      req.auth.usuarioId
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            "Você só pode confirmar a alteração do seu próprio e-mail."
        });
    }

    const novoEmail =
      String(
        req.body?.email ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !novoEmail ||
      !novoEmail.includes("@")
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe um e-mail válido."
        });
    }

    const usuario =
      await prisma.usuario.findFirst({
        where: {
          id:
            usuarioId,
          empresaId:
            req.auth.empresaId,
          ativo:
            true
        },
        select: {
          id: true,
          nome: true,
          email: true
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

    if (
      novoEmail ===
      usuario.email
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Este já é o seu e-mail atual."
        });
    }

    const emailEmUso =
      await prisma.usuario.findUnique({
        where: {
          email:
            novoEmail
        },
        select: {
          id: true
        }
      });

    if (emailEmUso) {
      return res
        .status(409)
        .json({
          mensagem:
            "Este e-mail já está cadastrado."
        });
    }

    limparTrocasEmailExpiradas();

    const pendenteAtual =
      TROCAS_EMAIL_PENDENTES.get(
        usuarioId
      );

    if (pendenteAtual?.solicitadaEm) {
      const segundosDesde =
        Math.floor(
          (
            Date.now() -
            pendenteAtual.solicitadaEm.getTime()
          ) / 1000
        );

      if (
        segundosDesde <
        TROCA_EMAIL_REENVIO_SEGUNDOS
      ) {
        return res
          .status(429)
          .json({
            mensagem:
              `Aguarde ${TROCA_EMAIL_REENVIO_SEGUNDOS - segundosDesde} segundo(s) para solicitar outro código.`
          });
      }
    }

    const codigo =
      String(
        randomInt(
          100000,
          1000000
        )
      );

    const codigoHash =
      await bcrypt.hash(
        codigo,
        10
      );

    const expiraEm =
      new Date(
        Date.now() +
        10 * 60 * 1000
      );

    TROCAS_EMAIL_PENDENTES.set(
      usuarioId,
      {
        usuarioId,
        novoEmail,
        codigoHash,
        expiraEm,
        tentativas: 0,
        solicitadaEm: new Date()
      }
    );

    try {
      await enviarCodigoAlteracaoEmail({
        destino:
          novoEmail,
        codigo,
        nome:
          usuario.nome
      });
    } catch (erroEmail) {
      TROCAS_EMAIL_PENDENTES.delete(
        usuarioId
      );

      throw erroEmail;
    }

    return res.json({
      mensagem:
        "Código enviado para o novo e-mail. Ele expira em 10 minutos.",
      email:
        novoEmail
    });

  } catch (erro) {
    next(erro);
  }
}



export async function confirmarAlteracaoEmail(
  req,
  res,
  next
) {
  try {
    if (!ehAdministrador(req)) {
      return res
        .status(403)
        .json({
          mensagem:
            "Somente administradores podem confirmar esta alteração."
        });
    }

    const usuarioId =
      Number(
        req.params.usuarioId
      );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId !==
      req.auth.usuarioId
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            "Você só pode confirmar a alteração do seu próprio e-mail."
        });
    }

    const novoEmail =
      String(
        req.body?.email ||
        ""
      )
        .trim()
        .toLowerCase();

    const codigo =
      String(
        req.body?.codigo ||
        ""
      )
        .trim();

    if (
      !novoEmail ||
      !/^\d{6}$/.test(codigo)
    ) {
      return res
        .status(400)
        .json({
          mensagem:
            "Informe o novo e-mail e o código de 6 dígitos."
        });
    }

    limparTrocasEmailExpiradas();

    const verificacao =
      TROCAS_EMAIL_PENDENTES.get(
        usuarioId
      );

    if (
      !verificacao ||
      verificacao.novoEmail !== novoEmail ||
      verificacao.expiraEm <= new Date()
    ) {
      TROCAS_EMAIL_PENDENTES.delete(
        usuarioId
      );

      return res
        .status(400)
        .json({
          mensagem:
            "Código inválido ou expirado. Solicite um novo código."
        });
    }

    if (
      verificacao.tentativas >=
      TROCA_EMAIL_MAX_TENTATIVAS
    ) {
      TROCAS_EMAIL_PENDENTES.delete(
        usuarioId
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

      if (
        verificacao.tentativas >=
        TROCA_EMAIL_MAX_TENTATIVAS
      ) {
        TROCAS_EMAIL_PENDENTES.delete(
          usuarioId
        );
      }

      return res
        .status(400)
        .json({
          mensagem:
            `Código inválido. Restam ${Math.max(0, TROCA_EMAIL_MAX_TENTATIVAS - verificacao.tentativas)} tentativa(s).`
        });
    }

    const emailEmUso =
      await prisma.usuario.findUnique({
        where: {
          email:
            novoEmail
        },
        select: {
          id: true
        }
      });

    if (
      emailEmUso &&
      emailEmUso.id !==
      usuarioId
    ) {
      return res
        .status(409)
        .json({
          mensagem:
            "Este e-mail já está cadastrado."
        });
    }

    const atualizado =
      await prisma.usuario.update({
        where: {
          id:
            usuarioId
        },
        data: {
          email:
            novoEmail
        }
      });

    TROCAS_EMAIL_PENDENTES.delete(
      usuarioId
    );

    return res.json({
      mensagem:
        "E-mail de acesso atualizado e confirmado com sucesso.",
      usuario: {
        id:
          atualizado.id,
        nome:
          atualizado.nome,
        email:
          atualizado.email,
        cargo:
          atualizado.cargo,
        cargoTela:
          cargoParaTela(
            atualizado.cargo
          )
      }
    });

  } catch (erro) {
    next(erro);
  }
}
