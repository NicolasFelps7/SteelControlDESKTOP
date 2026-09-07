

// =====================================================
// MÁSCARAS DE DADOS INSTITUCIONAIS
// =====================================================

function apenasNumerosEmpresa(
  valor
) {
  return String(valor || "")
    .replace(/\D/g, "");
}


function mascaraCnpjEmpresa(
  valor
) {
  const numero =
    apenasNumerosEmpresa(valor)
      .slice(0, 14);

  return numero
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}


function mascaraTelefoneEmpresa(
  valor
) {
  const numero =
    apenasNumerosEmpresa(valor)
      .slice(0, 11);

  if (
    numero.length <= 10
  ) {
    return numero
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numero
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}


function mascaraCepEmpresa(
  valor
) {
  return apenasNumerosEmpresa(valor)
    .slice(0, 8)
    .replace(
      /^(\d{5})(\d)/,
      "$1-$2"
    );
}


function cnpjValidoEmpresa(
  valor
) {
  const cnpj =
    apenasNumerosEmpresa(valor);

  if (
    cnpj.length !== 14 ||
    /^(\d)\1{13}$/.test(cnpj)
  ) {
    return false;
  }

  const calcular =
    base => {
      let peso =
        base.length - 7;

      let soma = 0;

      for (const digito of base) {
        soma +=
          Number(digito) *
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
    calcular(base);

  const d2 =
    calcular(
      `${base}${d1}`
    );

  return cnpj ===
    `${base}${d1}${d2}`;
}


function notificarEmpresa(
  mensagem,
  tipo = "info",
  titulo = "SteelControl"
) {
  if (
    window.SteelUI?.toast
  ) {
    SteelUI.toast({
      titulo,
      mensagem,
      tipo
    });

    return;
  }

  console.log(
    `[${titulo}] ${mensagem}`
  );
}



function prepararLogoEmpresaParaTema(img) {
  if (!img) return;

  img.classList.remove("logo-monocromatica-escura");

  const analisar = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;

      const ctx = canvas.getContext(
        "2d",
        { willReadFrequently: true }
      );

      ctx.drawImage(img, 0, 0, 48, 48);

      const pixels =
        ctx.getImageData(0, 0, 48, 48).data;

      let validos = 0;
      let escuros = 0;
      let cinza = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 30) continue;

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        validos++;

        if ((r + g + b) / 3 < 95) escuros++;

        if (
          Math.max(r, g, b) -
          Math.min(r, g, b) <
          22
        ) {
          cinza++;
        }
      }

      if (!validos) return;

      img.classList.toggle(
        "logo-monocromatica-escura",
        escuros / validos > 0.62 &&
        cinza / validos > 0.72
      );
    } catch (_) {}
  };

  if (img.complete) analisar();
  else img.addEventListener("load", analisar, { once: true });
}

// =====================================================
// STEELCONTROL
// MINHA EMPRESA
// =====================================================


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const API_URL = window.STEELCONTROL_API_URL;

const MAX_FACE_SAMPLES = 1;
const FRAMES_NECESSARIOS = 4;


// =====================================================
// TEMA DO SISTEMA
// =====================================================

function aplicarTemaSalvo() {

  const temaSalvo =
    localStorage.getItem("temaSistema") ||
    "claro";


  const tema =
    temaSalvo === "escuro" ||
    temaSalvo === "dark"
      ? "escuro"
      : "claro";


  document.documentElement.setAttribute(
    "data-theme",
    tema
  );


  document.documentElement.style.colorScheme =
    tema === "escuro"
      ? "dark"
      : "light";

}


// aplica imediatamente para evitar piscar branco
aplicarTemaSalvo();


// Se o tema mudar em outra aba/página
window.addEventListener(
  "storage",
  event => {

    if (
      event.key === "temaSistema"
    ) {

      aplicarTemaSalvo();

    }

  }
);


// Reaplica ao voltar para a página
window.addEventListener(
  "pageshow",
  () => {

    aplicarTemaSalvo();

  }
);


window.addEventListener(
  "focus",
  () => {

    aplicarTemaSalvo();

  }
);


// =====================================================
// SESSÃO
// =====================================================

const token =
  localStorage.getItem(
    "token"
  );


if (!token) {

  window.location.href =
    "/app/login";

}


// =====================================================
// ESTADO
// =====================================================

let funcionarios = [];

let empresaAtual = null;

let usuarioFacialSelecionado = null;

let stream = null;

let intervaloAnalise = null;

let analisando = false;

let cadastrando = false;

let framesCorretos = 0;

// =====================================================
// NAVEGAÇÃO / LOGO DA EMPRESA
// =====================================================

function origemEmpresaAtual() {
  return (
    localStorage.getItem("empresaOrigem") ||
    "maquinas"
  );
}

function configurarBotaoVoltarEmpresa() {
  const origem = origemEmpresaAtual();
  const destinoDashboard =
    destinoSeguroDashboardEmpresa();

  const texto =
    document.getElementById(
      "empresaVoltarTexto"
    );

  if (texto) {
    texto.textContent =
      origem === "dashboard" &&
      (
        Boolean(destinoDashboard) ||
        Boolean(localStorage.getItem("maquinaId"))
      )
        ? "Painel da máquina"
        : "Máquinas";
  }
}

function destinoDashboardReferenciador() {
  if (!document.referrer) {
    return null;
  }

  try {
    const referencia =
      new URL(document.referrer);

    if (
      referencia.origin !==
      window.location.origin
    ) {
      return null;
    }

    const pagina =
      referencia.pathname
        .split("/")
        .pop();

    const painel =
      referencia.searchParams.get(
        "view"
      );

    if (
      (
        pagina === "index.html" ||
        pagina === "dashboard"
      ) &&
      (
        painel === "controller" ||
        painel === "dobot"
      )
    ) {
      return `/app/dashboard?view=${painel}`;
    }
  } catch {
    return null;
  }

  return null;
}

function destinoSeguroDashboardEmpresa() {
  const retorno =
    destinoDashboardReferenciador() ||
      localStorage.getItem(
        "empresaRetornoDashboard"
      ) ||
      localStorage.getItem(
        "dashboardMaquinaDestino"
      );

  const destinosPermitidos =
    new Map([
      ["/app/dashboard?view=controller", "/app/dashboard?view=controller"],
      ["/app/dashboard?view=dobot", "/app/dashboard?view=dobot"],
      ["index.html?view=controller", "/app/dashboard?view=controller"],
      ["index.html?view=dobot", "/app/dashboard?view=dobot"]
    ]);

  return destinosPermitidos.get(
    retorno
  ) || null;
}

function voltarOrigemEmpresa() {
  const origem = origemEmpresaAtual();
  const maquinaId =
    localStorage.getItem(
      "maquinaId"
    );

  const destinoSalvo =
    destinoSeguroDashboardEmpresa();

  if (
    origem === "dashboard" &&
    maquinaId &&
    destinoSalvo
  ) {
    window.location.href =
      destinoSalvo;
    return;
  }

  if (
    origem === "dashboard" &&
    maquinaId
  ) {
    const controlador =
      String(
        localStorage.getItem(
          "controladorSelecionado"
        ) || "OUTRO"
      ).toUpperCase();

    window.location.href =
      controlador === "DOBOT_MAGICIAN"
        ? "/app/dashboard?view=dobot"
        : "/app/dashboard?view=controller";
    return;
  }

  window.location.href =
    "/app/maquinas";
}

function definirLogoEmpresa(logoUrl) {
  const imagem =
    document.getElementById(
      "empresaLogo"
    );

  const placeholder =
    document.getElementById(
      "empresaLogoPlaceholder"
    );

  const removerLogoBtn =
    document.getElementById(
      "removerLogoBtn"
    );

  if (!imagem) {
    return;
  }

  if (!logoUrl) {
    imagem.hidden = true;
    imagem.removeAttribute(
      "src"
    );

    if (placeholder) {
      placeholder.hidden = false;
    }

    if (removerLogoBtn) {
      removerLogoBtn.hidden = true;
    }

    return;
  }

  const urlFinal =
    logoUrl.startsWith("http://") ||
    logoUrl.startsWith("https://")
      ? logoUrl
      : `${API_URL}${logoUrl}`;

  imagem.crossOrigin = "anonymous";

  imagem.onload = () => {
    prepararLogoEmpresaParaTema(imagem);
    imagem.hidden = false;

    if (placeholder) {
      placeholder.hidden = true;
    }

    if (removerLogoBtn) {
      removerLogoBtn.hidden =
        !usuarioEhAdministrador();
    }
  };

  imagem.onerror = () => {
    imagem.hidden = true;

    if (placeholder) {
      placeholder.hidden = false;
    }
  };

  // Evita a exibição de uma imagem antiga em cache após a troca da logo.
  const separador =
    urlFinal.includes("?")
      ? "&"
      : "?";

  imagem.src =
    `${urlFinal}${separador}v=${Date.now()}`;
}

configurarBotaoVoltarEmpresa();



// =====================================================
// ELEMENTOS
// =====================================================

const funcionariosGrid =
  document.getElementById(
    "funcionariosGrid"
  );

const mensagemEmpresa =
  document.getElementById(
    "mensagemEmpresa"
  );

const modalFuncionario =
  document.getElementById(
    "modalFuncionario"
  );

const formFuncionario =
  document.getElementById(
    "formFuncionario"
  );

const mensagemFuncionario =
  document.getElementById(
    "mensagemFuncionario"
  );


// =====================================================
// EMPRESA
// =====================================================

const formDadosEmpresa =
  document.getElementById(
    "formDadosEmpresa"
  );

const mensagemDadosEmpresa =
  document.getElementById(
    "mensagemDadosEmpresa"
  );

const editarEmpresaBtn =
  document.getElementById(
    "editarEmpresaBtn"
  );

const acoesEditarEmpresa =
  document.getElementById(
    "acoesEditarEmpresa"
  );


// =====================================================
// FACIAL
// =====================================================

const faceModal =
  document.getElementById(
    "faceModal"
  );

const faceVideo =
  document.getElementById(
    "faceVideo"
  );

const faceOverlay =
  document.getElementById(
    "faceOverlay"
  );

const captureCanvas =
  document.getElementById(
    "captureCanvas"
  );

const cameraLoading =
  document.getElementById(
    "cameraLoading"
  );

const cameraStatus =
  document.getElementById(
    "cameraStatus"
  );

const cameraStatusTitulo =
  document.getElementById(
    "cameraStatusTitulo"
  );

const cameraStatusTexto =
  document.getElementById(
    "cameraStatusTexto"
  );

const progressoFace =
  document.getElementById(
    "progressoFace"
  );

const progressoTexto =
  document.getElementById(
    "progressoTexto"
  );

const consentimentoFace =
  document.getElementById(
    "consentimentoFace"
  );

const nomeFacialAmostra =
  document.getElementById(
    "nomeFacialAmostra"
  );

const facesManagerModal =
  document.getElementById(
    "facesManagerModal"
  );

const facesManagerList =
  document.getElementById(
    "facesManagerList"
  );

const facesManagerUserName =
  document.getElementById(
    "facesManagerUserName"
  );

const facesManagerMessage =
  document.getElementById(
    "facesManagerMessage"
  );


// =====================================================
// CAMPOS DA EMPRESA
// =====================================================

const CAMPOS_EMPRESA = [

  "empresaNomeInput",

  "empresaCnpjInput",

  "empresaTelefoneInput",

  "empresaEmailInput",

  "empresaSiteInput",

  "empresaCepInput",

  "empresaEnderecoInput",

  "empresaNumeroInput",

  "empresaComplementoInput",

  "empresaBairroInput",

  "empresaCidadeInput",

  "empresaEstadoInput",

  "empresaPaisInput"

];


// =====================================================
// VERIFICAR ADMINISTRADOR
// =====================================================

function usuarioEhAdministrador() {

  const cargo =
    (
      localStorage.getItem(
        "cargoUsuario"
      ) || ""
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  return (
    cargo === "administrador" ||
    cargo === "admin"
  );

}



function ehUsuarioAtual(
  usuario
) {
  const idSessao =
    Number(
      localStorage.getItem(
        "usuarioId"
      )
    );

  if (
    Number.isInteger(idSessao) &&
    idSessao > 0 &&
    Number(usuario?.id) ===
    idSessao
  ) {
    return true;
  }

  return (
    String(usuario?.email || "")
      .toLowerCase() ===
    String(
      localStorage.getItem(
        "usuarioLogado"
      ) || ""
    )
      .toLowerCase()
  );
}


// =====================================================
// LER RESPOSTA DA API
// =====================================================

async function lerResposta(
  resposta
) {

  const texto =
    await resposta.text();


  if (!texto) {

    return {};

  }


  try {

    return JSON.parse(
      texto
    );

  } catch {

    console.error(
      "Resposta inválida:",
      texto
    );


    throw new Error(
      "O servidor retornou uma resposta inválida."
    );

  }

}


// =====================================================
// API AUTENTICADA
// =====================================================

async function api(
  rota,
  opcoes = {}
) {

  const headers =
    new Headers(
      opcoes.headers ||
      {}
    );


  headers.set(
    "Authorization",
    `Bearer ${token}`
  );


  headers.set(
    "Cache-Control",
    "no-cache"
  );

  const resposta =
    await fetch(
      `${API_URL}${rota}`,
      {
        ...opcoes,
        headers,
        cache: "no-store"
      }
    );


  if (
    resposta.status === 401
  ) {

    sair(false);


    throw new Error(
      "Sessão expirada."
    );

  }


  const dados =
    await lerResposta(
      resposta
    );


  if (!resposta.ok) {

    throw new Error(
      dados.mensagem ||
      dados.erro ||
      dados.detail ||
      "Erro na operação."
    );

  }


  return dados;

}


// =====================================================
// USUÁRIO ATUAL
// =====================================================

function carregarUsuarioAtual() {

  const nome =
    document.getElementById(
      "usuarioAtualNome"
    );

  const email =
    document.getElementById(
      "usuarioAtualEmail"
    );

  const cargo =
    document.getElementById(
      "usuarioAtualCargo"
    );


  if (nome) {

    nome.textContent =
      localStorage.getItem(
        "nomeUsuario"
      ) ||
      "Usuário";

  }


  if (email) {

    email.textContent =
      localStorage.getItem(
        "usuarioLogado"
      ) ||
      "-";

  }


  if (cargo) {

    cargo.textContent =
      localStorage.getItem(
        "cargoUsuario"
      ) ||
      "-";

  }

}


// =====================================================
// PREENCHER CAMPO
// =====================================================

function preencherCampoEmpresa(
  id,
  valor
) {

  const campo =
    document.getElementById(
      id
    );


  if (!campo) {

    return;

  }


  campo.value =
    valor ?? "";

}


// =====================================================
// CARREGAR EMPRESA
// =====================================================

async function carregarEmpresa() {

  try {

    const empresa =
      await api(
        "/empresa/me"
      );


    empresaAtual =
      empresa;


    // =================================================
    // HERO
    // =================================================

    const nomeHero =
      document.getElementById(
        "empresaNome"
      );

    const cnpjHero =
      document.getElementById(
        "empresaCnpj"
      );


    if (nomeHero) {

      nomeHero.textContent =
        empresa.nome ||
        "Empresa";

    }


    if (cnpjHero) {

      cnpjHero.textContent =
        empresa.cnpj ||
        "Não informado";

    }


    // =================================================
    // LOGO
    // =================================================

    definirLogoEmpresa(
      empresa.logoUrl
    );


    // =================================================
    // CAMPOS
    // =================================================

    preencherCampoEmpresa(
      "empresaNomeInput",
      empresa.nome
    );

    preencherCampoEmpresa(
      "empresaCnpjInput",
      empresa.cnpj
    );

    preencherCampoEmpresa(
      "empresaTelefoneInput",
      empresa.telefone
    );

    preencherCampoEmpresa(
      "empresaEmailInput",
      empresa.email
    );

    preencherCampoEmpresa(
      "empresaSiteInput",
      empresa.site
    );

    preencherCampoEmpresa(
      "empresaCepInput",
      empresa.cep
    );

    preencherCampoEmpresa(
      "empresaEnderecoInput",
      empresa.endereco
    );

    preencherCampoEmpresa(
      "empresaNumeroInput",
      empresa.numero
    );

    preencherCampoEmpresa(
      "empresaComplementoInput",
      empresa.complemento
    );

    preencherCampoEmpresa(
      "empresaBairroInput",
      empresa.bairro
    );

    preencherCampoEmpresa(
      "empresaCidadeInput",
      empresa.cidade
    );

    preencherCampoEmpresa(
      "empresaEstadoInput",
      empresa.estado
    );

    preencherCampoEmpresa(
      "empresaPaisInput",
      empresa.pais ||
      "Brasil"
    );


    atualizarMapaEmpresa(
      empresa
    );


    atualizarLocalizacaoHero(
      empresa
    );


    localStorage.setItem(
      "empresa",
      JSON.stringify(
        empresa
      )
    );


  } catch (erro) {

    console.error(
      erro
    );


    if (
      mensagemEmpresa
    ) {

      mensagemEmpresa.textContent =
        erro.message;


      mensagemEmpresa.className =
        "message error";

    }

  }

}


// =====================================================
// LOCALIZAÇÃO NO HERO
// =====================================================

function atualizarLocalizacaoHero(
  empresa
) {

  const elemento =
    document.getElementById(
      "empresaLocalizacaoHero"
    );


  if (!elemento) {

    return;

  }


  if (
    empresa.cidade ||
    empresa.estado
  ) {

    const local =
      [
        empresa.cidade,
        empresa.estado
      ]
        .filter(Boolean)
        .join(" - ");


    elemento.textContent =
      `${local} • Gerencie funcionários, acessos e dados institucionais.`;

  } else {

    elemento.textContent =
      "Gerencie funcionários, dados institucionais, localização e métodos de autenticação da empresa.";

  }

}




[
  [
    "empresaCnpjInput",
    mascaraCnpjEmpresa
  ],
  [
    "empresaTelefoneInput",
    mascaraTelefoneEmpresa
  ],
  [
    "empresaCepInput",
    mascaraCepEmpresa
  ]
].forEach(
  ([id, formatador]) => {
    document
      .getElementById(id)
      ?.addEventListener(
        "input",
        event => {
          event.target.value =
            formatador(
              event.target.value
            );
        }
      );
  }
);


// =====================================================
// UPLOAD DA LOGO
// =====================================================

document
  .getElementById(
    "inputLogo"
  )
  ?.addEventListener(
    "change",
    async event => {

      const arquivo =
        event.target.files?.[0];


      if (!arquivo) {

        return;

      }


      if (
        !usuarioEhAdministrador()
      ) {

        notificarEmpresa(
          "Somente administradores podem alterar a logo.",
          "warning",
          "Acesso restrito"
        );

        event.target.value =
          "";

        return;

      }


      const formatos = [
        "image/png",
        "image/jpeg",
        "image/webp"
      ];


      if (
        !formatos.includes(
          arquivo.type
        )
      ) {

        notificarEmpresa(
          "Selecione uma imagem PNG, JPG ou WEBP.",
          "warning",
          "Formato não suportado"
        );

        event.target.value =
          "";

        return;

      }


      if (
        arquivo.size >
        5 * 1024 * 1024
      ) {

        notificarEmpresa(
          "A imagem deve possuir no máximo 5 MB.",
          "warning",
          "Arquivo muito grande"
        );

        event.target.value =
          "";

        return;

      }


      const form =
        new FormData();


      form.append(
        "logo",
        arquivo
      );


      try {

        const resposta =
          await fetch(
            `${API_URL}/empresa/logo`,
            {

              method: "POST",

              headers: {

                Authorization:
                  `Bearer ${token}`

              },

              body: form

            }
          );


        const dados =
          await lerResposta(
            resposta
          );


        if (!resposta.ok) {

          throw new Error(
            dados.mensagem ||
            "Não foi possível alterar a logo."
          );

        }


        const logoUrl =
          dados.empresa?.logoUrl ||
          dados.logoUrl;


        if (
          !dados.empresa?.temLogo ||
          !logoUrl
        ) {
          throw new Error(
            "O PostgreSQL não confirmou o salvamento da logo."
          );
        }


        if (logoUrl) {

          definirLogoEmpresa(
            logoUrl
          );


          if (empresaAtual) {

            empresaAtual = {
              ...empresaAtual,
              ...dados.empresa
            };

            localStorage.setItem(
              "empresa",
              JSON.stringify(
                empresaAtual
              )
            );

          }

          notificarEmpresa(
            "A nova identidade visual foi aplicada com sucesso.",
            "success",
            "Logo atualizada"
          );

        }


        event.target.value =
          "";


      } catch (erro) {

        notificarEmpresa(
          erro.message,
          "error",
          "Não foi possível alterar a logo"
        );

      }

    }
  );




// =====================================================
// REMOVER LOGO DA EMPRESA
// =====================================================

document
  .getElementById(
    "removerLogoBtn"
  )
  ?.addEventListener(
    "click",
    async () => {

      if (
        !usuarioEhAdministrador()
      ) {
        notificarEmpresa(
          "Somente administradores podem remover a logo.",
          "warning",
          "Acesso restrito"
        );

        return;
      }


      const confirmou =
        window.SteelUI?.confirm
          ? await SteelUI.confirm({
              titulo:
                "Remover logo da empresa?",
              mensagem:
                "A logo personalizada será removida e o SteelControl voltará a usar sua identidade visual padrão.",
              confirmar:
                "Remover logo",
              cancelar:
                "Cancelar"
            })
          : true;


      if (!confirmou) {
        return;
      }


      try {

        const resposta =
          await fetch(
            `${API_URL}/empresa/logo`,
            {
              method:
                "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        const dados =
          await lerResposta(
            resposta
          );


        if (!resposta.ok) {
          throw new Error(
            dados.mensagem ||
            "Não foi possível remover a logo."
          );
        }


        definirLogoEmpresa(
          null
        );


        if (
          empresaAtual
        ) {
          empresaAtual.logoUrl =
            null;

          localStorage.setItem(
            "empresa",
            JSON.stringify(
              empresaAtual
            )
          );
        }


        notificarEmpresa(
          "Logo removida. A identidade padrão do SteelControl foi restaurada.",
          "success",
          "Logo removida"
        );


      } catch (erro) {

        notificarEmpresa(
          erro.message,
          "error",
          "Não foi possível remover a logo"
        );

      }

    }
  );


// =====================================================
// HABILITAR EDIÇÃO
// =====================================================

function habilitarEdicaoEmpresa() {

  if (
    !usuarioEhAdministrador()
  ) {

    notificarEmpresa(
      "Somente administradores podem alterar os dados da empresa.",
      "warning",
      "Acesso restrito"
    );

    return;

  }


  CAMPOS_EMPRESA.forEach(
    id => {

      const campo =
        document.getElementById(
          id
        );


      if (campo) {

        campo.disabled =
          false;

      }

    }
  );


  if (
    acoesEditarEmpresa
  ) {

    acoesEditarEmpresa.style.display =
      "flex";

  }


  if (
    editarEmpresaBtn
  ) {

    editarEmpresaBtn.style.display =
      "none";

  }


  document
    .getElementById(
      "empresaNomeInput"
    )
    ?.focus();

}


// =====================================================
// DESABILITAR EDIÇÃO
// =====================================================

function desabilitarEdicaoEmpresa() {

  CAMPOS_EMPRESA.forEach(
    id => {

      const campo =
        document.getElementById(
          id
        );


      if (campo) {

        campo.disabled =
          true;

      }

    }
  );


  if (
    acoesEditarEmpresa
  ) {

    acoesEditarEmpresa.style.display =
      "none";

  }


  if (
    editarEmpresaBtn &&
    usuarioEhAdministrador()
  ) {

    editarEmpresaBtn.style.display =
      "inline-flex";

  }

}


// =====================================================
// CANCELAR EDIÇÃO
// =====================================================

function cancelarEdicaoEmpresa() {

  if (
    empresaAtual
  ) {

    preencherCampoEmpresa(
      "empresaNomeInput",
      empresaAtual.nome
    );

    preencherCampoEmpresa(
      "empresaCnpjInput",
      empresaAtual.cnpj
    );

    preencherCampoEmpresa(
      "empresaTelefoneInput",
      empresaAtual.telefone
    );

    preencherCampoEmpresa(
      "empresaEmailInput",
      empresaAtual.email
    );

    preencherCampoEmpresa(
      "empresaSiteInput",
      empresaAtual.site
    );

    preencherCampoEmpresa(
      "empresaCepInput",
      empresaAtual.cep
    );

    preencherCampoEmpresa(
      "empresaEnderecoInput",
      empresaAtual.endereco
    );

    preencherCampoEmpresa(
      "empresaNumeroInput",
      empresaAtual.numero
    );

    preencherCampoEmpresa(
      "empresaComplementoInput",
      empresaAtual.complemento
    );

    preencherCampoEmpresa(
      "empresaBairroInput",
      empresaAtual.bairro
    );

    preencherCampoEmpresa(
      "empresaCidadeInput",
      empresaAtual.cidade
    );

    preencherCampoEmpresa(
      "empresaEstadoInput",
      empresaAtual.estado
    );

    preencherCampoEmpresa(
      "empresaPaisInput",
      empresaAtual.pais ||
      "Brasil"
    );

  }


  if (
    mensagemDadosEmpresa
  ) {

    mensagemDadosEmpresa.textContent =
      "";

  }


  desabilitarEdicaoEmpresa();

}


// =====================================================
// VALOR DO CAMPO
// =====================================================

function valorCampoEmpresa(
  id
) {

  return (
    document
      .getElementById(id)
      ?.value
      ?.trim() ||
    ""
  );

}


// =====================================================
// CNPJ
// =====================================================

document
  .getElementById(
    "empresaCnpjInput"
  )
  ?.addEventListener(
    "input",
    event => {

      let valor =
        event.target.value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            14
          );


      valor =
        valor.replace(
          /^(\d{2})(\d)/,
          "$1.$2"
        );


      valor =
        valor.replace(
          /^(\d{2})\.(\d{3})(\d)/,
          "$1.$2.$3"
        );


      valor =
        valor.replace(
          /\.(\d{3})(\d)/,
          ".$1/$2"
        );


      valor =
        valor.replace(
          /(\d{4})(\d)/,
          "$1-$2"
        );


      event.target.value =
        valor;

    }
  );


// =====================================================
// CEP
// =====================================================

document
  .getElementById(
    "empresaCepInput"
  )
  ?.addEventListener(
    "input",
    event => {

      let valor =
        event.target.value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            8
          );


      if (
        valor.length > 5
      ) {

        valor =
          `${valor.slice(0, 5)}-${valor.slice(5)}`;

      }


      event.target.value =
        valor;

    }
  );


// =====================================================
// TELEFONE
// =====================================================

document
  .getElementById(
    "empresaTelefoneInput"
  )
  ?.addEventListener(
    "input",
    event => {

      let valor =
        event.target.value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            11
          );


      if (
        valor.length > 10
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
          );

      } else if (
        valor.length > 6
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d{4})(\d{0,4})$/,
            "($1) $2-$3"
          );

      } else if (
        valor.length > 2
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d+)/,
            "($1) $2"
          );

      }


      event.target.value =
        valor;

    }
  );


// =====================================================
// ESTADO
// =====================================================

document
  .getElementById(
    "empresaEstadoInput"
  )
  ?.addEventListener(
    "input",
    event => {

      event.target.value =
        event.target.value
          .replace(
            /[^a-zA-Z]/g,
            ""
          )
          .toUpperCase()
          .slice(
            0,
            2
          );

    }
  );


// =====================================================
// SALVAR EMPRESA
// =====================================================

formDadosEmpresa
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !usuarioEhAdministrador()
      ) {

        return;

      }


      const payload = {

        nome:
          valorCampoEmpresa(
            "empresaNomeInput"
          ),

        cnpj:
          valorCampoEmpresa(
            "empresaCnpjInput"
          ) ||
          null,

        telefone:
          valorCampoEmpresa(
            "empresaTelefoneInput"
          ) ||
          null,

        email:
          valorCampoEmpresa(
            "empresaEmailInput"
          ) ||
          null,

        site:
          valorCampoEmpresa(
            "empresaSiteInput"
          ) ||
          null,

        cep:
          valorCampoEmpresa(
            "empresaCepInput"
          ) ||
          null,

        endereco:
          valorCampoEmpresa(
            "empresaEnderecoInput"
          ) ||
          null,

        numero:
          valorCampoEmpresa(
            "empresaNumeroInput"
          ) ||
          null,

        complemento:
          valorCampoEmpresa(
            "empresaComplementoInput"
          ) ||
          null,

        bairro:
          valorCampoEmpresa(
            "empresaBairroInput"
          ) ||
          null,

        cidade:
          valorCampoEmpresa(
            "empresaCidadeInput"
          ) ||
          null,

        estado:
          valorCampoEmpresa(
            "empresaEstadoInput"
          ) ||
          null,

        pais:
          valorCampoEmpresa(
            "empresaPaisInput"
          ) ||
          "Brasil"

      };


      if (
        !payload.nome
      ) {

        mensagemDadosEmpresa.textContent =
          "Informe o nome da empresa.";


        mensagemDadosEmpresa.className =
          "form-message error";


        return;

      }


      mensagemDadosEmpresa.textContent =
        "Salvando alterações...";


      mensagemDadosEmpresa.className =
        "form-message";


      try {

        const resultado =
          await api(
            "/empresa/me",
            {

              method: "PUT",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify(
                  payload
                )

            }
          );


        empresaAtual =
          resultado.empresa ||
          resultado;


        mensagemDadosEmpresa.textContent =
          resultado.mensagem ||
          "Dados da empresa atualizados com sucesso.";


        mensagemDadosEmpresa.className =
          "form-message success";


        desabilitarEdicaoEmpresa();


        await carregarEmpresa();


      } catch (erro) {

        mensagemDadosEmpresa.textContent =
          erro.message;


        mensagemDadosEmpresa.className =
          "form-message error";

      }

    }
  );


// =====================================================
// ENDEREÇO
// =====================================================

function montarEnderecoEmpresa(
  empresa
) {

  if (!empresa) {

    return "";

  }


  return [

    empresa.endereco,

    empresa.numero,

    empresa.bairro,

    empresa.cidade,

    empresa.estado,

    empresa.cep,

    empresa.pais

  ]
    .filter(Boolean)
    .join(", ");

}


// =====================================================
// MAPA
// =====================================================

function atualizarMapaEmpresa(
  empresa
) {

  const mapa =
    document.getElementById(
      "empresaMapa"
    );

  const semEndereco =
    document.getElementById(
      "mapaSemEndereco"
    );

  const enderecoResumo =
    document.getElementById(
      "empresaEnderecoResumo"
    );

  const cidadeResumo =
    document.getElementById(
      "empresaCidadeResumo"
    );

  const abrirMapaBtn =
    document.getElementById(
      "abrirMapaBtn"
    );


  if (!mapa) {

    return;

  }


  const enderecoCompleto =
    montarEnderecoEmpresa(
      empresa
    );


  if (
    !empresa?.endereco ||
    !empresa?.cidade
  ) {

    mapa.removeAttribute(
      "src"
    );


    if (semEndereco) {

      semEndereco.style.display =
        "flex";

    }


    if (enderecoResumo) {

      enderecoResumo.textContent =
        "Endereço não cadastrado";

    }


    if (cidadeResumo) {

      cidadeResumo.textContent =
        "Adicione a localização da empresa.";

    }


    if (abrirMapaBtn) {

      abrirMapaBtn.disabled =
        true;

    }


    return;

  }


  const mapaUrl =
    `https://www.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`;

  // Exibe o mapa quando houver conexão. Os dados do endereço continuam
  // disponíveis no cartão abaixo caso o computador esteja sem internet.
  if (navigator.onLine !== false) {
    mapa.src = mapaUrl;
    mapa.style.display = "block";

    if (semEndereco) {
      semEndereco.style.display = "none";
    }
  } else {
    mapa.removeAttribute("src");
    mapa.style.display = "none";

    if (semEndereco) {
      semEndereco.style.display = "flex";
      const titulo = semEndereco.querySelector("strong");
      const detalhe = semEndereco.querySelector("span");
      if (titulo) titulo.textContent = "Localização cadastrada";
      if (detalhe) detalhe.textContent = enderecoCompleto;
    }
  }


  if (enderecoResumo) {

    enderecoResumo.textContent =
      [
        empresa.endereco,
        empresa.numero
      ]
        .filter(Boolean)
        .join(", ");

  }


  if (cidadeResumo) {

    cidadeResumo.textContent =
      [
        empresa.bairro,
        empresa.cidade,
        empresa.estado,
        empresa.pais
      ]
        .filter(Boolean)
        .join(" • ");

  }


  if (abrirMapaBtn) {

    abrirMapaBtn.disabled =
      false;

  }

}


// =====================================================
// ABRIR GOOGLE MAPS
// =====================================================

async function abrirMapaEmpresa() {
  const endereco = montarEnderecoEmpresa(empresaAtual);
  if (!endereco) return;

  try {
    await navigator.clipboard.writeText(endereco);
    window.SteelUI?.toast?.({
      tipo: "success",
      titulo: "Endereço copiado",
      mensagem: "O endereço foi copiado. O SteelControl não precisa de internet para exibir os dados da empresa."
    });
  } catch (_) {
    window.SteelUI?.toast?.({
      tipo: "info",
      titulo: "Endereço da empresa",
      mensagem: endereco
    });
  }
}

// =====================================================
// FORMATAR CARGO
// =====================================================

function formatarCargo(
  cargo
) {

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


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHtml(
  texto
) {

  return String(
    texto ||
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// =====================================================
// CARREGAR FUNCIONÁRIOS
// =====================================================

async function carregarFuncionarios(
  { silencioso = false } = {}
) {

  if (!funcionariosGrid) {
    return;
  }

  if (!silencioso) {
    funcionariosGrid.innerHTML = `
      <div class="loading-users">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Carregando funcionários...
      </div>
    `;
  }


  try {

    funcionarios =
      await api(
        "/empresa/usuarios"
      );


    if (
      !Array.isArray(
        funcionarios
      )
    ) {

      funcionarios = [];

    }


    renderizarFuncionarios();

    atualizarResumo();


  } catch (erro) {

    funcionariosGrid.innerHTML = `

      <div class="loading-users">

        <i class="fa-solid fa-triangle-exclamation"></i>

        ${escaparHtml(erro.message)}

      </div>

    `;

  }

}


// =====================================================
// RENDERIZAR FUNCIONÁRIOS
// =====================================================

function renderizarFuncionarios() {

  funcionariosGrid.innerHTML =
    "";


  if (
    funcionarios.length === 0
  ) {

    funcionariosGrid.innerHTML = `

      <div class="loading-users">

        Nenhum funcionário cadastrado.

      </div>

    `;


    return;

  }


  const admin =
    usuarioEhAdministrador();


  funcionarios.forEach(
    usuario => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "employee-card";


      const quantidade =
        Number(
          usuario.quantidadeFaces ||
          0
        );


      const possuiFacial =
        Boolean(
          usuario.facialCadastrada ||
          quantidade > 0
        );


      card.innerHTML = `

        <div class="employee-top">

          <div class="employee-avatar">

            <i class="fa-solid fa-user"></i>

          </div>


          <div class="employee-info">

            <h3>
              ${escaparHtml(usuario.nome)}
            </h3>

            <p>
              ${escaparHtml(usuario.email)}
            </p>

            <span class="role-badge">
              ${formatarCargo(usuario.cargo)}
            </span>

          </div>

        </div>


        <div
          class="
            employee-face-status
            ${
              possuiFacial
                ? "active"
                : "inactive"
            }
          "
        >

          <div class="face-status-title">

            <i
              class="
                fa-solid
                ${
                  possuiFacial
                    ? "fa-circle-check"
                    : "fa-circle-xmark"
                }
              "
            ></i>

            ${
              possuiFacial
                ? "Reconhecimento facial ativo"
                : "Facial não cadastrada"
            }

          </div>


          <p>

            ${
              possuiFacial

                ? "Biometria única vinculada a este perfil."

                : "Nenhuma amostra facial cadastrada."
            }

          </p>

        </div>


        ${
          admin

            ? `

              <div class="employee-actions">

                <button
                  type="button"
                  class="edit-employee-btn"
                  onclick="abrirEditarFuncionario(${usuario.id})"
                >
                  <i class="fa-solid fa-user-pen"></i>
                  Editar acesso
                </button>

                <button
                  type="button"
                  class="face-user-btn"
                  onclick="abrirCadastroFacialFuncionario(${usuario.id})"
                  ${
                    quantidade >=
                    MAX_FACE_SAMPLES

                      ? "disabled"

                      : ""
                  }
                >

                  <i class="fa-solid fa-camera"></i>

                  ${
                    possuiFacial
                      ? "Facial já cadastrada"
                      : "Cadastrar facial"
                  }

                </button>


                ${
                  possuiFacial

                    ? `

                      <button
                        type="button"
                        class="remove-user-face-btn"
                        onclick="abrirGerenciadorFaciais(${usuario.id})"
                      >

                        <i class="fa-solid fa-list-check"></i>

                        Gerenciar facial

                      </button>

                    `

                    : ""
                }

                ${
!ehUsuarioAtual(usuario)
                    ? `
                      <button
                        type="button"
                        class="remove-employee-btn"
                        onclick="removerFuncionario(${usuario.id})"
                      >
                        <i class="fa-solid fa-user-minus"></i>
                        Desativar funcionário
                      </button>
                    `
                    : ""
                }

              </div>

            `

            : ""
        }

      `;


      funcionariosGrid.appendChild(
        card
      );

    }
  );

}


// =====================================================
// ESTADO LOCAL INSTANTÂNEO DOS FUNCIONÁRIOS
// =====================================================

function emitirAtualizacaoFuncionarios() {
  const detalhe = {
    empresaId: empresaAtual?.id || null,
    atualizadoEm: Date.now()
  };

  window.dispatchEvent(
    new CustomEvent(
      "steelcontrol:funcionarios-atualizados",
      { detail: detalhe }
    )
  );

  try {
    localStorage.setItem(
      "steelcontrol:funcionarios-atualizados",
      String(detalhe.atualizadoEm)
    );
  } catch (_) {}
}

function ordenarFuncionariosLocal() {
  funcionarios.sort((a, b) =>
    String(a?.nome || "").localeCompare(
      String(b?.nome || ""),
      "pt-BR",
      { sensitivity: "base" }
    )
  );
}

function atualizarFuncionarioLocal(usuario) {
  if (!usuario || !Number.isInteger(Number(usuario.id))) {
    return;
  }

  const id = Number(usuario.id);
  const indice = funcionarios.findIndex(
    item => Number(item.id) === id
  );

  const anterior = indice >= 0
    ? funcionarios[indice]
    : {};

  const normalizado = {
    ...anterior,
    ...usuario,
    id,
    quantidadeFaces:
      usuario.quantidadeFaces ??
      anterior.quantidadeFaces ??
      0,
    facialCadastrada:
      usuario.facialCadastrada ??
      anterior.facialCadastrada ??
      false
  };

  if (normalizado.ativo === false) {
    removerFuncionarioLocal(id, { emitir: false });
    return;
  }

  if (indice >= 0) {
    funcionarios.splice(indice, 1, normalizado);
  } else {
    funcionarios.push(normalizado);
  }

  ordenarFuncionariosLocal();
  renderizarFuncionarios();
  atualizarResumo();
  emitirAtualizacaoFuncionarios();
}

function removerFuncionarioLocal(
  usuarioId,
  { emitir = true } = {}
) {
  const id = Number(usuarioId);

  funcionarios = funcionarios.filter(
    item => Number(item.id) !== id
  );

  if (
    funcionarioEmEdicao &&
    Number(funcionarioEmEdicao.id) === id
  ) {
    fecharEditarFuncionario();
  }

  if (
    usuarioFacialSelecionado &&
    Number(usuarioFacialSelecionado.id) === id
  ) {
    fecharCameraFacial();
  }

  renderizarFuncionarios();
  atualizarResumo();

  if (emitir) {
    emitirAtualizacaoFuncionarios();
  }
}

window.addEventListener(
  "storage",
  event => {
    if (
      event.key ===
      "steelcontrol:funcionarios-atualizados"
    ) {
      carregarFuncionarios({ silencioso: true });
    }
  }
);



// =====================================================
// EDITAR FUNCIONÁRIO / ADMINISTRADOR
// =====================================================

let funcionarioEmEdicao = null;
let emailPendenteConfirmacao = null;


function abrirEditarFuncionario(
  usuarioId
) {

  if (
    !usuarioEhAdministrador()
  ) {

    notificarEmpresa(
      "Somente administradores podem editar usuários.",
      "warning",
      "Acesso restrito"
    );

    return;

  }


  const usuario =
    funcionarios.find(
      item =>
        Number(item.id) ===
        Number(usuarioId)
    );


  if (!usuario) {

    return;

  }


  funcionarioEmEdicao =
    usuario;

  emailPendenteConfirmacao =
    null;


  const modal =
    document.getElementById(
      "modalEditarFuncionario"
    );

  const id =
    document.getElementById(
      "editFuncionarioId"
    );

  const nome =
    document.getElementById(
      "editFuncionarioNome"
    );

  const email =
    document.getElementById(
      "editFuncionarioEmail"
    );

  const senha =
    document.getElementById(
      "editFuncionarioSenha"
    );

  const cargo =
    document.getElementById(
      "editFuncionarioCargo"
    );

  const verificacao =
    document.getElementById(
      "emailVerificationBox"
    );

  const codigo =
    document.getElementById(
      "emailVerificationCode"
    );

  const mensagem =
    document.getElementById(
      "mensagemEditarFuncionario"
    );


  if (id) {
    id.value =
      usuario.id;
  }

  if (nome) {
    nome.value =
      usuario.nome ||
      "";
  }

  if (email) {
    email.value =
      usuario.email ||
      "";
  }

  if (senha) {
    senha.value =
      "";
  }

  if (cargo) {
    cargo.value =
      usuario.cargo ||
      "VISITANTE";

    const propriaConta =
      ehUsuarioAtual(
        usuario
      );

    cargo.disabled =
      propriaConta;
  }

  if (verificacao) {
    verificacao.hidden =
      true;
  }

  if (codigo) {
    codigo.value =
      "";
  }

  if (mensagem) {
    mensagem.textContent =
      "";

    mensagem.className =
      "form-message";
  }


  modal?.classList.add(
    "ativo"
  );

}


function fecharEditarFuncionario() {

  document
    .getElementById(
      "modalEditarFuncionario"
    )
    ?.classList.remove(
      "ativo"
    );


  funcionarioEmEdicao =
    null;

  emailPendenteConfirmacao =
    null;

}


// =====================================================
// SALVAR EDIÇÃO DE USUÁRIO
// =====================================================

document
  .getElementById(
    "formEditarFuncionario"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !usuarioEhAdministrador() ||
        !funcionarioEmEdicao
      ) {

        return;

      }


      const usuarioId =
        Number(
          document
            .getElementById(
              "editFuncionarioId"
            )
            ?.value
        );


      const nome =
        document
          .getElementById(
            "editFuncionarioNome"
          )
          ?.value
          .trim() ||
        "";


      const novoEmail =
        document
          .getElementById(
            "editFuncionarioEmail"
          )
          ?.value
          .trim()
          .toLowerCase() ||
        "";


      const senha =
        document
          .getElementById(
            "editFuncionarioSenha"
          )
          ?.value ||
        "";


      const cargoCampo =
        document.getElementById(
          "editFuncionarioCargo"
        );


      const cargo =
        cargoCampo?.value ||
        funcionarioEmEdicao.cargo;


      const mensagem =
        document.getElementById(
          "mensagemEditarFuncionario"
        );


      const botao =
        document.getElementById(
          "salvarEdicaoFuncionarioBtn"
        );


      if (
        !nome ||
        !novoEmail
      ) {

        if (mensagem) {
          mensagem.textContent =
            "Informe nome e e-mail.";

          mensagem.className =
            "form-message error";
        }

        return;

      }


      if (
        senha &&
        senha.length <
        8
      ) {

        if (mensagem) {
          mensagem.textContent =
            "A nova senha deve possuir pelo menos 8 caracteres.";

          mensagem.className =
            "form-message error";
        }

        return;

      }


      const emailAtual =
        String(
          funcionarioEmEdicao.email ||
          ""
        ).toLowerCase();


      const propriaConta =
        ehUsuarioAtual(
          funcionarioEmEdicao
        );


      if (botao) {
        botao.disabled =
          true;

        botao.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
      }


      if (mensagem) {
        mensagem.textContent =
          "Salvando alterações...";

        mensagem.className =
          "form-message";
      }


      try {

        // -------------------------------------------------
        // Atualiza nome, senha e cargo.
        // Para a própria conta, o e-mail é confirmado à parte.
        // -------------------------------------------------

        const payload = {
          nome,
          cargo
        };


        if (
          !propriaConta ||
          novoEmail ===
          emailAtual
        ) {

          payload.email =
            novoEmail;

        }


        if (senha) {

          payload.senha =
            senha;

        }


        const resultado =
          await api(
            `/empresa/usuarios/${usuarioId}`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );


        if (propriaConta) {

          localStorage.setItem(
            "nomeUsuario",
            resultado.usuario?.nome ||
            nome
          );

        }


        // -------------------------------------------------
        // O próprio administrador mudou o e-mail:
        // envia código para o novo endereço.
        // -------------------------------------------------

        if (
          propriaConta &&
          novoEmail !==
          emailAtual
        ) {

          const envio =
            await api(
              `/empresa/usuarios/${usuarioId}/email-verification/request`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    email:
                      novoEmail
                  })
              }
            );


          emailPendenteConfirmacao =
            novoEmail;


          const caixa =
            document.getElementById(
              "emailVerificationBox"
            );


          const texto =
            document.getElementById(
              "emailVerificationText"
            );


          if (caixa) {
            caixa.hidden =
              false;
          }


          if (texto) {
            texto.textContent =
              `Enviamos um código de 6 dígitos para ${novoEmail}.`;
          }


          if (mensagem) {
            mensagem.textContent =
              envio.mensagem ||
              "Código enviado. Confirme o novo e-mail.";

            mensagem.className =
              "form-message success";
          }


          document
            .getElementById(
              "emailVerificationCode"
            )
            ?.focus();


          return;

        }


        if (mensagem) {
          mensagem.textContent =
            resultado.mensagem ||
            "Dados de acesso atualizados com sucesso.";

          mensagem.className =
            "form-message success";
        }


        if (resultado.usuario) {
          atualizarFuncionarioLocal(
            resultado.usuario
          );
        } else {
          await carregarFuncionarios({
            silencioso: true
          });
        }

        carregarUsuarioAtual();

        fecharEditarFuncionario();


      } catch (erro) {

        if (mensagem) {
          mensagem.textContent =
            erro.message ||
            "Não foi possível atualizar o usuário.";

          mensagem.className =
            "form-message error";
        }

      } finally {

        if (botao) {
          botao.disabled =
            false;

          botao.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações';
        }

      }

    }
  );


// =====================================================
// CONFIRMAR NOVO E-MAIL DO ADMINISTRADOR
// =====================================================

async function confirmarNovoEmailAdministrador() {

  if (
    !funcionarioEmEdicao ||
    !emailPendenteConfirmacao
  ) {

    return;

  }


  const codigo =
    document
      .getElementById(
        "emailVerificationCode"
      )
      ?.value
      .trim() ||
    "";


  const mensagem =
    document.getElementById(
      "mensagemEditarFuncionario"
    );


  const botao =
    document.getElementById(
      "confirmarNovoEmailBtn"
    );


  if (
    !/^\d{6}$/.test(
      codigo
    )
  ) {

    if (mensagem) {
      mensagem.textContent =
        "Digite o código de 6 dígitos enviado por e-mail.";

      mensagem.className =
        "form-message error";
    }

    return;

  }


  if (botao) {

    botao.disabled =
      true;

    botao.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Confirmando...';

  }


  try {

    const resultado =
      await api(
        `/empresa/usuarios/${funcionarioEmEdicao.id}/email-verification/confirm`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              email:
                emailPendenteConfirmacao,

              codigo
            })
        }
      );


    const emailConfirmado =
      resultado.usuario?.email ||
      emailPendenteConfirmacao;


    localStorage.setItem(
      "usuarioLogado",
      emailConfirmado
    );


    if (
      resultado.usuario?.nome
    ) {

      localStorage.setItem(
        "nomeUsuario",
        resultado.usuario.nome
      );

    }


    if (mensagem) {
      mensagem.textContent =
        resultado.mensagem ||
        "E-mail confirmado e atualizado.";

      mensagem.className =
        "form-message success";
    }


    emailPendenteConfirmacao =
      null;


    atualizarFuncionarioLocal({
      ...funcionarioEmEdicao,
      ...(resultado.usuario || {}),
      email: emailConfirmado
    });

    carregarUsuarioAtual();

    fecharEditarFuncionario();


  } catch (erro) {

    if (mensagem) {
      mensagem.textContent =
        erro.message ||
        "Não foi possível confirmar o novo e-mail.";

      mensagem.className =
        "form-message error";
    }

  } finally {

    if (botao) {
      botao.disabled =
        false;

      botao.innerHTML =
        "Confirmar código";
    }

  }

}


// =====================================================
// DESATIVAR FUNCIONÁRIO
// =====================================================

async function removerFuncionario(
  usuarioId
) {
  if (
    !usuarioEhAdministrador()
  ) {
    notificarEmpresa(
      "Somente administradores podem desativar funcionários.",
      "warning",
      "Acesso restrito"
    );
    return;
  }

  const usuario =
    funcionarios.find(
      item =>
        Number(item.id) ===
        Number(usuarioId)
    );

  const nome =
    usuario?.nome ||
    "este funcionário";

  const confirmar =
    window.SteelUI?.confirm
      ? await SteelUI.confirm({
          titulo:
            `Desativar ${nome}?`,
          mensagem:
            "A conta deixará de aparecer como funcionário ativo, perderá o acesso ao sistema e as credenciais faciais serão revogadas. O histórico continuará preservado.",
          confirmar:
            "Desativar funcionário",
          cancelar:
            "Cancelar"
        })
      : true;

  if (!confirmar) {
    return;
  }

  try {
    await api(
      `/empresa/usuarios/${usuarioId}`,
      {
        method: "DELETE"
      }
    );

    removerFuncionarioLocal(
      usuarioId
    );

    notificarEmpresa(
      `${nome} foi desativado com sucesso.`,
      "success",
      "Funcionário desativado"
    );

  } catch (erro) {
    notificarEmpresa(
      erro.message ||
      "Não foi possível desativar o funcionário.",
      "error",
      "Erro ao desativar"
    );
  }
}


// =====================================================
// RESUMO
// =====================================================

function atualizarResumo() {

  const comFacial =
    funcionarios.filter(
      usuario =>
        usuario.facialCadastrada ||
        Number(
          usuario.quantidadeFaces ||
          0
        ) > 0
    ).length;


  const admins =
    funcionarios.filter(
      usuario =>
        usuario.cargo ===
        "ADMINISTRADOR"
    ).length;


  const totalFuncionarios =
    document.getElementById(
      "totalFuncionarios"
    );

  const totalComFacial =
    document.getElementById(
      "totalComFacial"
    );

  const totalAdministradores =
    document.getElementById(
      "totalAdministradores"
    );


  if (totalFuncionarios) {

    totalFuncionarios.textContent =
      funcionarios.length;

  }


  if (totalComFacial) {

    totalComFacial.textContent =
      comFacial;

  }


  if (totalAdministradores) {

    totalAdministradores.textContent =
      admins;

  }

}


// =====================================================
// PERMISSÕES
// =====================================================

function aplicarPermissoes() {

  const administrador =
    usuarioEhAdministrador();


  const novoFuncionario =
    document.getElementById(
      "novoFuncionarioBtn"
    );

  const alterarLogo =
    document.getElementById(
      "alterarLogoBtn"
    );

  const editarEmpresa =
    document.getElementById(
      "editarEmpresaBtn"
    );


  if (!administrador) {

    if (novoFuncionario) {

      novoFuncionario.style.display =
        "none";

    }


    if (alterarLogo) {

      alterarLogo.style.display =
        "none";

    }


    if (editarEmpresa) {

      editarEmpresa.style.display =
        "none";

    }

  }

}


// =====================================================
// MODAL NOVO FUNCIONÁRIO
// =====================================================

function abrirNovoFuncionario() {

  if (
    !usuarioEhAdministrador()
  ) {

    return;

  }


  if (
    mensagemFuncionario
  ) {

    mensagemFuncionario.textContent =
      "";

  }


  modalFuncionario?.classList.add(
    "ativo"
  );

}


function fecharNovoFuncionario() {

  modalFuncionario?.classList.remove(
    "ativo"
  );

}


// =====================================================
// CRIAR FUNCIONÁRIO
// =====================================================

formFuncionario
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      mensagemFuncionario.textContent =
        "Cadastrando...";


      mensagemFuncionario.className =
        "form-message";


      const payload = {

        nome:
          document
            .getElementById(
              "funcNome"
            )
            .value
            .trim(),

        email:
          document
            .getElementById(
              "funcEmail"
            )
            .value
            .trim(),

        senha:
          document
            .getElementById(
              "funcSenha"
            )
            .value,

        cargo:
          document
            .getElementById(
              "funcCargo"
            )
            .value

      };


      try {

        const resultado =
          await api(
            "/empresa/usuarios",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify(
                  payload
                )

            }
          );


        mensagemFuncionario.textContent =
          resultado.mensagem ||
          (
            resultado.reativado
              ? "Funcionário reativado com sucesso."
              : "Funcionário cadastrado."
          );


        mensagemFuncionario.className =
          "form-message success";


        window.SteelUI?.toast({

          tipo:
            "success",

          titulo:
            resultado.reativado
              ? "Funcionário recontratado"
              : "Funcionário cadastrado",

          mensagem:
            resultado.reativado
              ? "A conta foi reativada. Por segurança, cadastre novamente o reconhecimento facial."
              : "O novo acesso foi criado com sucesso."

        });


        formFuncionario.reset();

        if (resultado.usuario) {
          atualizarFuncionarioLocal(
            resultado.usuario
          );
        } else {
          await carregarFuncionarios({
            silencioso: true
          });
        }

        fecharNovoFuncionario();


      } catch (erro) {

        mensagemFuncionario.textContent =
          erro.message;


        mensagemFuncionario.className =
          "form-message error";

      }

    }
  );


// =====================================================
// ABRIR FACIAL
// =====================================================

async function abrirCadastroFacialFuncionario(
  usuarioId
) {

  if (
    !usuarioEhAdministrador()
  ) {

    return;

  }


  const usuario =
    funcionarios.find(
      item =>
        Number(item.id) ===
        Number(usuarioId)
    );


  if (!usuario) {

    return;

  }


  const quantidade =
    Number(
      usuario.quantidadeFaces ||
      0
    );


  if (
    quantidade >=
    MAX_FACE_SAMPLES
  ) {

    notificarEmpresa(
      "Este perfil já possui uma biometria facial. Remova a facial atual antes de cadastrar outra.",
      "warning",
      "Limite de biometria"
    );

    return;

  }


  usuarioFacialSelecionado =
    usuario;


  framesCorretos = 0;

  cadastrando = false;

  analisando = false;


  atualizarProgresso();


  if (
    consentimentoFace
  ) {

    consentimentoFace.checked =
      false;

  }


  if (
    nomeFacialAmostra
  ) {

    nomeFacialAmostra.value =
      quantidade === 0
        ? "Principal"
        : `Facial ${quantidade + 1}`;

  }


  const funcionarioNome =
    document.getElementById(
      "funcionarioFacialNome"
    );


  if (funcionarioNome) {

    funcionarioNome.textContent =
      `${usuario.nome} • cadastro facial único`;

  }


  faceModal?.classList.add(
    "ativo"
  );


  if (cameraLoading) {

    cameraLoading.style.display =
      "flex";

  }


  alterarStatusCamera(
    "analisando",
    "Abrindo câmera...",
    "Aguarde alguns segundos."
  );


  try {

    stream =
      await navigator
        .mediaDevices
        .getUserMedia({

          video: {

            facingMode:
              "user",

            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            }

          },

          audio: false

        });


    faceVideo.srcObject =
      stream;


    await faceVideo.play();


    if (cameraLoading) {

      cameraLoading.style.display =
        "none";

    }


    alterarStatusCamera(
      "analisando",
      "Procurando rosto...",
      "Posicione o rosto no centro da câmera."
    );


    iniciarAnalise();


  } catch (erro) {

    console.error(
      erro
    );


    if (cameraLoading) {

      cameraLoading.style.display =
        "none";

    }


    alterarStatusCamera(
      "erro",
      "Não foi possível acessar a câmera",
      "Permita o acesso à câmera no navegador."
    );

  }

}


// =====================================================
// INICIAR ANÁLISE
// =====================================================

function iniciarAnalise() {

  if (
    intervaloAnalise
  ) {

    clearInterval(
      intervaloAnalise
    );

  }


  analisarFrame();


  intervaloAnalise =
    setInterval(
      analisarFrame,
      600
    );

}


// =====================================================
// CAPTURAR FRAME
// =====================================================

async function capturarFrame() {

  if (
    !faceVideo?.videoWidth ||
    !faceVideo?.videoHeight
  ) {

    return null;

  }


  const largura = 640;


  const altura =
    Math.round(
      largura *
      (
        faceVideo.videoHeight /
        faceVideo.videoWidth
      )
    );


  captureCanvas.width =
    largura;


  captureCanvas.height =
    altura;


  const ctx =
    captureCanvas.getContext(
      "2d"
    );


  ctx.drawImage(
    faceVideo,
    0,
    0,
    largura,
    altura
  );


  return new Promise(
    resolve => {

      captureCanvas.toBlob(
        resolve,
        "image/jpeg",
        0.9
      );

    }
  );

}


// =====================================================
// ANALISAR FRAME
// =====================================================

async function analisarFrame() {

  if (
    analisando ||
    cadastrando
  ) {

    return;

  }


  if (
    !consentimentoFace?.checked
  ) {

    framesCorretos = 0;

    atualizarProgresso();


    alterarStatusCamera(
      "analisando",
      "Aguardando autorização",
      "Confirme o consentimento biométrico acima."
    );


    return;

  }


  analisando = true;


  try {

    const blob =
      await capturarFrame();


    if (!blob) {

      return;

    }


    const form =
      new FormData();


    form.append(
      "imagem",
      blob,
      "frame.jpg"
    );


    const resposta =
      await fetch(
        `${API_URL}/auth/face/analyze-image`,
        {

          method: "POST",

          body: form

        }
      );


    const dados =
      await lerResposta(
        resposta
      );


    if (!resposta.ok) {

      throw new Error(
        dados.detail ||
        dados.mensagem ||
        "Erro na análise."
      );

    }


    processarAnalise(
      dados
    );


  } catch (erro) {

    framesCorretos = 0;


    atualizarProgresso();


    alterarStatusCamera(
      "erro",
      "Erro na análise facial",
      erro.message
    );


  } finally {

    analisando = false;

  }

}


// =====================================================
// PROCESSAR ANÁLISE
// =====================================================

function processarAnalise(
  dados
) {

  if (
    dados.detectado &&
    dados.bbox
  ) {

    desenharQuadrado(
      dados.bbox,
      dados.larguraImagem,
      dados.alturaImagem
    );

  } else {

    limparQuadrado();

  }


  if (
    dados.multiplosRostos
  ) {

    framesCorretos = 0;

    atualizarProgresso();


    alterarStatusCamera(
      "erro",
      "Mais de uma pessoa detectada",
      "Apenas o funcionário deve aparecer."
    );


    return;

  }


  if (
    !dados.pronto
  ) {

    framesCorretos = 0;

    atualizarProgresso();


    alterarStatusCamera(

      dados.tipoOrientacao ===
      "erro"

        ? "erro"

        : "analisando",

      dados.detectado

        ? "Ajuste o rosto"

        : "Procurando rosto...",

      dados.orientacao ||
      "Posicione o rosto corretamente."

    );


    return;

  }


  framesCorretos++;


  atualizarProgresso();


  alterarStatusCamera(
    "sucesso",
    "Posição correta",
    `Mantenha-se parado (${framesCorretos}/${FRAMES_NECESSARIOS}).`
  );


  if (
    framesCorretos >=
    FRAMES_NECESSARIOS
  ) {

    cadastrarEmbeddingFuncionario();

  }

}


// =====================================================
// CADASTRAR EMBEDDING
// =====================================================

async function cadastrarEmbeddingFuncionario() {

  if (
    cadastrando ||
    !usuarioFacialSelecionado
  ) {

    return;

  }


  const nomeAmostra =
    nomeFacialAmostra?.value
      ?.replace(/\s+/g, " ")
      .trim();


  if (
    !nomeAmostra ||
    nomeAmostra.length < 2
  ) {

    framesCorretos = 0;

    atualizarProgresso();

    alterarStatusCamera(
      "erro",
      "Dê um nome para a facial",
      "Use pelo menos 2 caracteres, por exemplo: Principal ou Sem óculos."
    );

    nomeFacialAmostra?.focus();

    return;

  }


  cadastrando = true;


  alterarStatusCamera(
    "analisando",
    "Registrando biometria...",
    "Não se mova."
  );


  try {

    const blob =
      await capturarFrame();


    if (!blob) {

      throw new Error(
        "Não foi possível capturar o rosto."
      );

    }


    // =================================================
    // NODE -> PYTHON -> NODE
    // O navegador envia somente a imagem. O embedding
    // confiável é gerado pelo serviço facial via backend.
    // =================================================

    const form =
      new FormData();


    form.append(
      "imagem",
      blob,
      "cadastro.jpg"
    );


    form.append(
      "nomeFacial",
      nomeAmostra
    );


    const respostaNode =
      await fetch(
        `${API_URL}/empresa/usuarios/${usuarioFacialSelecionado.id}/face-image`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          },

          body:
            form
        }
      );


    const resultado =
      await lerResposta(
        respostaNode
      );


    if (
      !respostaNode.ok
    ) {

      throw new Error(
        resultado.mensagem ||
        "Não foi possível salvar a facial."
      );

    }


    if (progressoFace) {

      progressoFace.style.width =
        "100%";

    }


    if (progressoTexto) {

      progressoTexto.textContent =
        "100%";

    }


    const nomeFuncionario =
      usuarioFacialSelecionado.nome;


    alterarStatusCamera(
      "sucesso",
      "Facial cadastrada!",
      `${resultado.nomeFacial || nomeAmostra} cadastrada e vinculada exclusivamente a este perfil.`
    );


    const usuarioAtualizado = {
      ...usuarioFacialSelecionado,
      quantidadeFaces: 1,
      facialCadastrada: true
    };

    fecharCameraFacial();

    atualizarFuncionarioLocal(
      usuarioAtualizado
    );

    if (
      mensagemEmpresa
    ) {

      mensagemEmpresa.textContent =
        `Facial "${resultado.nomeFacial || nomeAmostra}" de ${nomeFuncionario} cadastrada com sucesso.`;

      mensagemEmpresa.className =
        "message success";

    }


  } catch (erro) {

    cadastrando = false;

    framesCorretos = 0;


    atualizarProgresso();


    alterarStatusCamera(
      "erro",
      "Cadastro não concluído",
      erro.message
    );

  }

}


// =====================================================
// GERENCIAR FACIAIS NOMEADAS
// =====================================================

function formatarDataFacial(
  valor
) {

  if (!valor) {
    return "Data não informada";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "Data não informada";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}


function fecharGerenciadorFaciais() {

  facesManagerModal?.classList.remove(
    "ativo"
  );

  if (facesManagerList) {
    facesManagerList.innerHTML = "";
  }

  if (facesManagerMessage) {
    facesManagerMessage.textContent = "";
    facesManagerMessage.className =
      "form-message";
  }
}


async function abrirGerenciadorFaciais(
  usuarioId
) {

  if (
    !usuarioEhAdministrador()
  ) {
    return;
  }

  const usuario =
    funcionarios.find(
      item =>
        Number(item.id) ===
        Number(usuarioId)
    );

  if (!usuario) {
    return;
  }

  if (facesManagerUserName) {
    facesManagerUserName.textContent =
      `${usuario.nome} • escolha uma facial para excluir`;
  }

  if (facesManagerList) {
    facesManagerList.innerHTML = `
      <div class="faces-manager-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Carregando faciais...
      </div>
    `;
  }

  if (facesManagerMessage) {
    facesManagerMessage.textContent = "";
    facesManagerMessage.className =
      "form-message";
  }

  facesManagerModal?.classList.add(
    "ativo"
  );

  try {

    const resultado =
      await api(
        `/empresa/usuarios/${usuarioId}/faces`
      );

    const faciais =
      Array.isArray(
        resultado.faciais
      )
        ? resultado.faciais
        : [];

    renderizarFaciaisGerenciador(
      usuario,
      faciais
    );

  } catch (erro) {

    if (facesManagerList) {
      facesManagerList.innerHTML = `
        <div class="faces-manager-empty">
          Não foi possível carregar as faciais.
        </div>
      `;
    }

    if (facesManagerMessage) {
      facesManagerMessage.textContent =
        erro.message;

      facesManagerMessage.className =
        "form-message error";
    }
  }
}


function renderizarFaciaisGerenciador(
  usuario,
  faciais
) {

  if (!facesManagerList) {
    return;
  }

  if (!faciais.length) {
    facesManagerList.innerHTML = `
      <div class="faces-manager-empty">
        <i class="fa-solid fa-face-meh"></i>
        <br>
        Nenhuma facial cadastrada neste perfil.
      </div>
    `;
    return;
  }

  facesManagerList.innerHTML =
    faciais
      .map(
        (facial, indice) => {

          const nome =
            facial.nome ||
            `Facial ${indice + 1}`;

          const nomeCodificado =
            encodeURIComponent(nome)
              .replace(/'/g, "%27");

          return `
            <button
              type="button"
              class="face-sample-item"
              onclick="excluirFacialNomeada(${usuario.id}, ${facial.id}, decodeURIComponent('${nomeCodificado}'))"
              title="Excluir somente ${escaparHtml(nome)}"
            >
              <span class="face-sample-icon">
                <i class="fa-solid fa-face-viewfinder"></i>
              </span>

              <span class="face-sample-info">
                <strong>${escaparHtml(nome)}</strong>
                <span>${formatarDataFacial(facial.criadoEm)}</span>
              </span>

              <span class="face-sample-delete">
                <i class="fa-solid fa-trash-can"></i>
              </span>
            </button>
          `;
        }
      )
      .join("");
}



async function excluirFacialNomeada(
  usuarioId,
  faceId,
  nomeFacial
) {

  if (
    !usuarioEhAdministrador()
  ) {
    return;
  }

  const usuario =
    funcionarios.find(
      item =>
        Number(item.id) ===
        Number(usuarioId)
    );

  if (!usuario) {
    return;
  }

  const confirmou =
    window.SteelUI?.confirm
      ? await SteelUI.confirm({
          titulo:
            `Excluir "${nomeFacial}"?`,
          mensagem:
            `A biometria facial de ${usuario.nome} será removida. Depois disso, será possível cadastrar um novo rosto.`,
          confirmar:
            "Excluir esta facial",
          cancelar:
            "Cancelar"
        })
      : window.confirm(
          `Excluir somente a facial "${nomeFacial}"?`
        );

  if (!confirmou) {
    return;
  }

  try {

    const resultado =
      await api(
        `/empresa/usuarios/${usuarioId}/faces/${faceId}`,
        {
          method: "DELETE"
        }
      );

    if (facesManagerMessage) {
      facesManagerMessage.textContent =
        resultado.mensagem ||
        `Facial "${nomeFacial}" removida.`;

      facesManagerMessage.className =
        "form-message success";
    }

    // Atualiza a lista sem fechar o modal e sincroniza o card
    // do funcionário imediatamente, sem recarregar a página.
    const atualizado =
      await api(
        `/empresa/usuarios/${usuarioId}/faces`
      );

    const faciaisAtuais =
      Array.isArray(atualizado.faciais)
        ? atualizado.faciais
        : [];

    atualizarFuncionarioLocal({
      ...usuario,
      quantidadeFaces: faciaisAtuais.length,
      facialCadastrada: faciaisAtuais.length > 0
    });

    renderizarFaciaisGerenciador(
      usuario,
      faciaisAtuais
    );

  } catch (erro) {

    if (facesManagerMessage) {
      facesManagerMessage.textContent =
        erro.message;

      facesManagerMessage.className =
        "form-message error";
    }
  }
}


// =====================================================
// PROGRESSO
// =====================================================

function atualizarProgresso() {

  const percentual =
    Math.min(
      100,
      Math.round(
        (
          framesCorretos /
          FRAMES_NECESSARIOS
        ) *
        100
      )
    );


  if (
    progressoFace
  ) {

    progressoFace.style.width =
      `${percentual}%`;

  }


  if (
    progressoTexto
  ) {

    progressoTexto.textContent =
      `${percentual}%`;

  }

}


// =====================================================
// DESENHAR QUADRADO
// =====================================================

function desenharQuadrado(
  bbox,
  larguraImagem,
  alturaImagem
) {

  if (
    !faceVideo ||
    !faceOverlay ||
    !bbox ||
    !larguraImagem ||
    !alturaImagem
  ) {

    return;

  }


  const largura =
    faceVideo.clientWidth;


  const altura =
    faceVideo.clientHeight;


  faceOverlay.width =
    largura;


  faceOverlay.height =
    altura;


  const ctx =
    faceOverlay.getContext(
      "2d"
    );


  ctx.clearRect(
    0,
    0,
    largura,
    altura
  );


  const escala =
    Math.max(
      largura /
      larguraImagem,

      altura /
      alturaImagem
    );


  const renderWidth =
    larguraImagem *
    escala;


  const renderHeight =
    alturaImagem *
    escala;


  const offsetX =
    (
      largura -
      renderWidth
    ) / 2;


  const offsetY =
    (
      altura -
      renderHeight
    ) / 2;


  const x1 =
    offsetX +
    bbox.x1 *
    escala;


  const x2 =
    offsetX +
    bbox.x2 *
    escala;


  // vídeo espelhado
  const x =
    largura -
    x2;


  const y =
    offsetY +
    bbox.y1 *
    escala;


  const boxWidth =
    x2 -
    x1;


  const boxHeight =
    (
      bbox.y2 -
      bbox.y1
    ) *
    escala;


  ctx.strokeStyle =
    "#22c55e";


  ctx.lineWidth = 4;


  ctx.shadowColor =
    "#22c55e";


  ctx.shadowBlur = 14;


  ctx.strokeRect(
    x,
    y,
    boxWidth,
    boxHeight
  );


  desenharCantos(
    ctx,
    x,
    y,
    boxWidth,
    boxHeight
  );

}


// =====================================================
// CANTOS DO QUADRADO
// =====================================================

function desenharCantos(
  ctx,
  x,
  y,
  largura,
  altura
) {

  const tamanho =
    Math.min(
      28,
      largura * 0.18,
      altura * 0.18
    );


  ctx.shadowBlur = 3;

  ctx.strokeStyle =
    "#86efac";

  ctx.lineWidth = 6;


  // SUPERIOR ESQUERDA

  ctx.beginPath();

  ctx.moveTo(
    x,
    y + tamanho
  );

  ctx.lineTo(
    x,
    y
  );

  ctx.lineTo(
    x + tamanho,
    y
  );

  ctx.stroke();


  // SUPERIOR DIREITA

  ctx.beginPath();

  ctx.moveTo(
    x + largura - tamanho,
    y
  );

  ctx.lineTo(
    x + largura,
    y
  );

  ctx.lineTo(
    x + largura,
    y + tamanho
  );

  ctx.stroke();


  // INFERIOR ESQUERDA

  ctx.beginPath();

  ctx.moveTo(
    x,
    y + altura - tamanho
  );

  ctx.lineTo(
    x,
    y + altura
  );

  ctx.lineTo(
    x + tamanho,
    y + altura
  );

  ctx.stroke();


  // INFERIOR DIREITA

  ctx.beginPath();

  ctx.moveTo(
    x + largura - tamanho,
    y + altura
  );

  ctx.lineTo(
    x + largura,
    y + altura
  );

  ctx.lineTo(
    x + largura,
    y + altura - tamanho
  );

  ctx.stroke();

}


// =====================================================
// LIMPAR QUADRADO
// =====================================================

function limparQuadrado() {

  if (
    !faceOverlay
  ) {

    return;

  }


  const ctx =
    faceOverlay.getContext(
      "2d"
    );


  ctx.clearRect(
    0,
    0,
    faceOverlay.width,
    faceOverlay.height
  );

}


// =====================================================
// STATUS DA CÂMERA
// =====================================================

function alterarStatusCamera(
  tipo,
  titulo,
  texto
) {

  if (
    cameraStatus
  ) {

    cameraStatus.className =
      `camera-status ${tipo}`;

  }


  if (
    cameraStatusTitulo
  ) {

    cameraStatusTitulo.textContent =
      titulo;

  }


  if (
    cameraStatusTexto
  ) {

    cameraStatusTexto.textContent =
      texto;

  }

}


// =====================================================
// FECHAR CÂMERA
// =====================================================

function fecharCameraFacial() {

  pararCamera();


  faceModal?.classList.remove(
    "ativo"
  );


  usuarioFacialSelecionado =
    null;

}


// =====================================================
// PARAR CÂMERA
// =====================================================

function pararCamera() {

  if (
    intervaloAnalise
  ) {

    clearInterval(
      intervaloAnalise
    );


    intervaloAnalise =
      null;

  }


  if (
    stream
  ) {

    stream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    stream = null;

  }


  if (
    faceVideo
  ) {

    faceVideo.srcObject =
      null;

  }


  analisando = false;

  cadastrando = false;

  framesCorretos = 0;


  atualizarProgresso();

  limparQuadrado();

}


// =====================================================
// VOLTAR DASHBOARD
// =====================================================

function voltarDashboard() {

  voltarOrigemEmpresa();

}


// =====================================================
// SAIR
// =====================================================

async function sair(confirmar = true) {

  if (confirmar) {

    const confirmado =
      await window.confirmarSaidaDaConta?.();


    if (!confirmado) return;

  }

  pararCamera();


  localStorage.removeItem(
    "autenticado"
  );

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "usuarioLogado"
  );

  localStorage.removeItem(
    "nomeUsuario"
  );

  localStorage.removeItem(
    "cargoUsuario"
  );

  localStorage.removeItem(
    "empresa"
  );


  // NÃO removemos temaSistema.
  // Assim o tema continua salvo para o próximo login.


  window.location.href =
    "/app/login";

}


// =====================================================
// FECHAR MODAIS CLICANDO FORA
// =====================================================

modalFuncionario
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modalFuncionario
      ) {

        fecharNovoFuncionario();

      }

    }
  );


faceModal
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        faceModal
      ) {

        fecharCameraFacial();

      }

    }
  );


// =====================================================
// ESC
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      fecharNovoFuncionario();

      fecharCameraFacial();


      if (
        acoesEditarEmpresa
          ?.style
          .display ===
        "flex"
      ) {

        cancelarEdicaoEmpresa();

      }

    }

  }
);


// =====================================================
// INICIAR
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // garante novamente o mesmo tema do dashboard
    aplicarTemaSalvo();


    carregarUsuarioAtual();


    aplicarPermissoes();


    await carregarEmpresa();


    await carregarFuncionarios();

  }
);

// =====================================================
// SINCRONIZAÇÃO MULTI-DISPOSITIVO — MINHA EMPRESA
// =====================================================
let steelEmpresaRealtimeTimer = null;

window.addEventListener(
  "steelcontrol:empresa-evento",
  event => {
    const tipo = String(event.detail?.tipo || "");
    if (!tipo || tipo === "conectado") return;

    clearTimeout(steelEmpresaRealtimeTimer);
    steelEmpresaRealtimeTimer = setTimeout(async () => {
      try {
        if (tipo.startsWith("usuario.")) {
          await carregarFuncionarios({ silencioso: true });
          return;
        }

        if (tipo.startsWith("empresa.")) {
          await carregarEmpresa();
          await carregarFuncionarios({ silencioso: true });
        }
      } catch (_) {}
    }, 120);
  }
);


// =====================================================
// FALLBACK REALTIME CONFIÁVEL — REVISÃO NO POSTGRESQL
// =====================================================
// O SSE continua sendo a via principal. Esta verificação leve existe
// para garantir que uma alteração feita no tablet apareça no PC mesmo
// quando o navegador perder/pausar o stream. Não recarrega a página:
// somente busca novamente os dados quando a revisão realmente muda.
let steelEmpresaRevisaoAtual = null;
let steelEmpresaRevisionBusy = false;
let steelEmpresaRevisionInterval = null;

async function verificarRevisaoEmpresa() {
  if (
    steelEmpresaRevisionBusy ||
    document.hidden ||
    !token
  ) {
    return;
  }

  steelEmpresaRevisionBusy = true;

  try {
    const dados = await api(
      `/empresa/revision?_=${Date.now()}`
    );

    const revisao = String(dados?.revisao || "");
    if (!revisao) return;

    if (steelEmpresaRevisaoAtual === null) {
      steelEmpresaRevisaoAtual = revisao;
      return;
    }

    if (revisao !== steelEmpresaRevisaoAtual) {
      steelEmpresaRevisaoAtual = revisao;

      // Atualização silenciosa: nenhum F5, nenhum piscar de tela.
      await carregarFuncionarios({ silencioso: true });

      // Dados institucionais também podem ter sido alterados por outro
      // dispositivo. Mantém logo/nome/endereço sincronizados.
      try {
        await carregarEmpresa();
      } catch (_) {}
    }
  } catch (_) {
    // Se a rede oscilar, tentamos novamente no próximo ciclo.
  } finally {
    steelEmpresaRevisionBusy = false;
  }
}

function iniciarFallbackRevisaoEmpresa() {
  if (steelEmpresaRevisionInterval) return;

  // Obtém a revisão inicial logo após abrir a tela.
  verificarRevisaoEmpresa();

  steelEmpresaRevisionInterval = setInterval(
    verificarRevisaoEmpresa,
    1000
  );
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    verificarRevisaoEmpresa();
  }
});

window.addEventListener("beforeunload", () => {
  if (steelEmpresaRevisionInterval) {
    clearInterval(steelEmpresaRevisionInterval);
  }
});

// A página já possui seu DOMContentLoaded de inicialização. Este listener
// separado inicia apenas o fallback e não interfere no carregamento normal.
document.addEventListener(
  "DOMContentLoaded",
  iniciarFallbackRevisaoEmpresa
);
