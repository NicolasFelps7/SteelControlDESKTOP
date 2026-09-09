

// =========================================================
// CNPJ — MÁSCARA E VALIDAÇÃO
// =========================================================

function somenteDigitos(valor) {
  return String(valor || "")
    .replace(/\D/g, "");
}


function formatarCnpj(valor) {
  const digitos =
    somenteDigitos(valor)
      .slice(0, 14);

  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}


function cnpjValido(valor) {
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

      for (const caractere of base) {
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

  const base12 =
    cnpj.slice(0, 12);

  const digito1 =
    calcularDigito(base12);

  const digito2 =
    calcularDigito(
      base12 +
      digito1
    );

  return cnpj ===
    `${base12}${digito1}${digito2}`;
}


const campoCnpjCadastro =
  document.getElementById(
    "empresaCnpj"
  );


campoCnpjCadastro
  ?.addEventListener(
    "input",
    event => {
      event.target.value =
        formatarCnpj(
          event.target.value
        );

      event.target.setCustomValidity(
        ""
      );
    }
  );


campoCnpjCadastro
  ?.addEventListener(
    "blur",
    event => {
      if (
        event.target.value &&
        !cnpjValido(
          event.target.value
        )
      ) {
        event.target.setCustomValidity(
          "Informe um CNPJ válido."
        );
      } else {
        event.target.setCustomValidity(
          ""
        );
      }
    }
  );

// ========================================================
// CONFIG
// ========================================================

const API_URL =
  window.STEELCONTROL_API_URL;


// ========================================================
// ELEMENTOS LOGIN
// ========================================================

const loginForm =
  document.getElementById(
    "loginForm"
  );

const cadastroForm =
  document.getElementById(
    "cadastroForm"
  );

const mensagem =
  document.getElementById(
    "mensagem"
  );

const mensagemCadastro =
  document.getElementById(
    "mensagemCadastro"
  );

const avisoSessaoRemota = (() => {
  try {
    const valor = sessionStorage.getItem("steelcontrol_session_notice");
    sessionStorage.removeItem("steelcontrol_session_notice");
    return valor;
  } catch (_) {
    return null;
  }
})();

if (avisoSessaoRemota && mensagem) {
  mensagem.textContent = avisoSessaoRemota;
  mensagem.className = "message erro";
}

const areaLogin =
  document.getElementById(
    "areaLogin"
  );

const areaCadastro =
  document.getElementById(
    "areaCadastro"
  );


// ========================================================
// VERIFICAÇÃO DE E-MAIL DO CADASTRO
// ========================================================

const emailVerificationPanel =
  document.getElementById("emailVerificationPanel");

const verificationEmail =
  document.getElementById("verificationEmail");

const codigoCadastro =
  document.getElementById("codigoCadastro");

const btnSolicitarCodigo =
  document.getElementById("btnSolicitarCodigo");

const btnConfirmarCodigo =
  document.getElementById("btnConfirmarCodigo");

const btnReenviarCodigo =
  document.getElementById("btnReenviarCodigo");

const btnEditarCadastro =
  document.getElementById("btnEditarCadastro");

const textoReenvio =
  document.getElementById("textoReenvio");

let cadastroVerificacaoId = null;
let cadastroPayloadPendente = null;
let reenvioInterval = null;


// ========================================================
// FACE
// ========================================================

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

const faceStatus =
  document.getElementById(
    "faceStatus"
  );

const faceStatusTitulo =
  document.getElementById(
    "faceStatusTitulo"
  );

const faceStatusTexto =
  document.getElementById(
    "faceStatusTexto"
  );


let faceStream = null;

let faceInterval = null;

let analisando =
  false;

let autenticando =
  false;

let framesCorretos =
  0;

// Prova de vida simples por movimento de cabeça.
// Etapas: frontal -> movimento -> retorno -> reconhecimento.
let etapaLiveness =
  "frontal";

let livenessConfirmado =
  false;

let livenessBlob =
  null;

let frontalInicialBlob =
  null;

let livenessMovementTimer =
  null;

const LIVENESS_MOVEMENT_TIMEOUT_MS =
  8000;

let modoFace =
  "login";

let cadastroPendente =
  null;


// ========================================================
// MENSAGEM VISUAL DE BOAS-VINDAS
// ========================================================

function textoAcesso(chave, parametros = {}) {
  if (typeof window.t === "function") {
    return window.t(chave, parametros);
  }

  if (typeof t === "function") {
    return t(chave, parametros);
  }

  return chave;
}


function mensagemTraduzida(texto) {
  if (typeof traduzirTextoLivre === "function") {
    return traduzirTextoLivre(texto);
  }

  return String(texto || "");
}


function mostrarBoasVindas({ titulo, texto, cadastro = false }) {
  document
    .querySelector(".access-welcome-overlay")
    ?.remove();

  const overlay =
    document.createElement("div");

  overlay.className =
    "access-welcome-overlay";

  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");

  overlay.innerHTML = `
    <div class="access-welcome-card ${cadastro ? "is-register" : ""}">
      <div class="access-welcome-brand">
        <img src="assets/img/steel-icon.svg" alt="" aria-hidden="true">
        <span>SteelControl</span>
      </div>
      <div class="access-welcome-check" aria-hidden="true">
        <i class="fa-solid ${cadastro ? "fa-wand-magic-sparkles" : "fa-check"}"></i>
      </div>
      <h2></h2>
      <p></p>
      <div class="access-welcome-loading">
        <span></span>
        <small></small>
      </div>
    </div>
  `;

  overlay.querySelector("h2").textContent =
    titulo;

  overlay.querySelector("p").textContent =
    texto;

  overlay.querySelector("small").textContent =
    textoAcesso("redirectingWorkspace");

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
  });
}


// ========================================================
// SALVAR SESSÃO
// ========================================================

function salvarSessao(
  dados
) {

  localStorage.setItem(
    "autenticado",
    "true"
  );

  localStorage.setItem(
    "token",
    dados.token
  );

  if (dados.usuario?.id) {
    localStorage.setItem(
      "usuarioId",
      String(dados.usuario.id)
    );
  }

  localStorage.setItem(
    "usuarioLogado",
    dados.usuario?.email || ""
  );

  localStorage.setItem(
    "nomeUsuario",
    dados.usuario?.nome || "Usuário"
  );

  localStorage.setItem(
    "cargoUsuario",
    dados.usuario?.cargo || "Cargo"
  );


  if (dados.empresa) {

    localStorage.setItem(
      "empresa",
      JSON.stringify(
        dados.empresa
      )
    );

  }

}


// ========================================================
// SENHA
// ========================================================

function mostrarSenha() {

  const senha =
    document.getElementById(
      "senha"
    );

  const icone =
    document.getElementById(
      "iconeSenha"
    );


  if (
    senha.type ===
    "password"
  ) {

    senha.type =
      "text";

    icone.classList.remove(
      "fa-eye"
    );

    icone.classList.add(
      "fa-eye-slash"
    );

  } else {

    senha.type =
      "password";

    icone.classList.remove(
      "fa-eye-slash"
    );

    icone.classList.add(
      "fa-eye"
    );

  }

}


// ========================================================
// CADASTRO
// ========================================================

function abrirCriarConta() {

  areaLogin.style.display =
    "none";

  areaCadastro.style.display =
    "block";

}


function voltarLogin() {

  areaCadastro.style.display =
    "none";

  areaLogin.style.display =
    "block";

}


// ========================================================
// LOGIN NORMAL
// ========================================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const senha =
      document
        .getElementById("senha")
        .value;


    mensagem.textContent =
      "";


    try {

      const resposta =
        await fetch(
          `${API_URL}/auth/login`,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                email,
                senha

              })

          }
        );


      const dados =
        await resposta.json();


      if (!resposta.ok) {

        throw new Error(
          dados.mensagem
        );

      }


      salvarSessao(
        dados
      );


      mensagem.textContent =
        textoAcesso(
          "loginWelcomeTitle",
          { nome: dados.usuario?.nome || "" }
        );


      mensagem.className =
        "message sucesso";


      mostrarBoasVindas({
        titulo: textoAcesso(
          "loginWelcomeTitle",
          { nome: dados.usuario?.nome || "" }
        ),
        texto: textoAcesso("loginWelcomeText")
      });


      setTimeout(
        () => {

          window.location.href =
            "/app/maquinas";

        },

        1800
      );


    } catch (erro) {

      mensagem.textContent =
        mensagemTraduzida(erro.message);


      mensagem.className =
        "message erro";

    }

  }
);



// ========================================================
// CADASTRO COM E-MAIL REAL
// ========================================================

function obterPayloadCadastro() {
  return {
    empresa: {
      nome:
        document.getElementById("empresaNome").value.trim(),

      cnpj:
        document.getElementById("empresaCnpj").value.trim() || null
    },

    administrador: {
      nome:
        document.getElementById("nomeCadastro").value.trim(),

      email:
        document.getElementById("emailCadastro").value.trim(),

      senha:
        document.getElementById("senhaCadastro").value
    }
  };
}


function bloquearDadosDoCadastro(bloquear) {
  [
    "empresaNome",
    "empresaCnpj",
    "nomeCadastro",
    "emailCadastro",
    "senhaCadastro"
  ].forEach(id => {
    const campo = document.getElementById(id);

    if (campo) {
      campo.disabled = bloquear;
    }
  });
}


function iniciarContagemReenvio(segundos = 60) {
  if (
    !btnReenviarCodigo ||
    !textoReenvio
  ) {
    return;
  }

  clearInterval(reenvioInterval);

  let restante =
    Number(segundos) || 60;

  const atualizar = () => {
    if (restante > 0) {
      btnReenviarCodigo.disabled = true;
      textoReenvio.textContent =
        textoAcesso(
          "resendCodeIn",
          { segundos: restante }
        );

      restante--;
      return;
    }

    clearInterval(reenvioInterval);

    btnReenviarCodigo.disabled = false;
    textoReenvio.textContent =
      textoAcesso("resendCode");
  };

  atualizar();

  reenvioInterval =
    setInterval(atualizar, 1000);
}


function abrirEtapaCodigo(dados) {
  cadastroVerificacaoId =
    String(dados.verificacaoId || "");

  if (!cadastroVerificacaoId) {
    throw new Error(
      "O servidor não retornou a identificação da verificação."
    );
  }

  if (verificationEmail) {
    verificationEmail.textContent =
      dados.email ||
      cadastroPayloadPendente?.administrador?.email ||
      "seu e-mail";
  }

  bloquearDadosDoCadastro(true);

  if (btnSolicitarCodigo) {
    btnSolicitarCodigo.hidden = true;
    btnSolicitarCodigo.disabled = false;
  }

  if (emailVerificationPanel) {
    emailVerificationPanel.hidden = false;
  }

  if (codigoCadastro) {
    codigoCadastro.value = "";

    setTimeout(
      () => codigoCadastro.focus(),
      50
    );
  }

  iniciarContagemReenvio(
    dados.aguardeReenvioSegundos || 60
  );
}


function voltarEdicaoCadastroSeguro() {
  cadastroVerificacaoId = null;
  cadastroPayloadPendente = null;

  clearInterval(reenvioInterval);

  bloquearDadosDoCadastro(false);

  if (emailVerificationPanel) {
    emailVerificationPanel.hidden = true;
  }

  if (btnSolicitarCodigo) {
    btnSolicitarCodigo.hidden = false;
    btnSolicitarCodigo.disabled = false;
  }

  if (codigoCadastro) {
    codigoCadastro.value = "";
  }

  if (mensagemCadastro) {
    mensagemCadastro.textContent = "";
    mensagemCadastro.className = "message";
  }
}


async function solicitarCodigoCadastroSeguro() {
  cadastroPayloadPendente =
    obterPayloadCadastro();

  if (mensagemCadastro) {
    mensagemCadastro.textContent =
      textoAcesso("sendingCode");

    mensagemCadastro.className =
      "message";
  }

  if (btnSolicitarCodigo) {
    btnSolicitarCodigo.disabled = true;
  }

  try {
    const resposta =
      await fetch(
        `${API_URL}/auth/register-company/request-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body:
            JSON.stringify(
              cadastroPayloadPendente
            )
        }
      );

    const dados =
      await resposta
        .json()
        .catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
        "Não foi possível enviar o código."
      );
    }

    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        dados.mensagem ||
        textoAcesso("codeSent");

      mensagemCadastro.className =
        "message sucesso";
    }

    abrirEtapaCodigo(dados);

  } catch (erro) {
    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        mensagemTraduzida(erro.message);

      mensagemCadastro.className =
        "message erro";
    }

    if (btnSolicitarCodigo) {
      btnSolicitarCodigo.disabled = false;
    }
  }
}


async function confirmarCodigoCadastroSeguro() {
  const codigo =
    String(
      codigoCadastro?.value || ""
    )
      .replace(/\D/g, "")
      .slice(0, 6);

  if (
    !cadastroVerificacaoId ||
    codigo.length !== 6
  ) {
    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        textoAcesso("invalidCodeLength");

      mensagemCadastro.className =
        "message erro";
    }

    return;
  }

  if (btnConfirmarCodigo) {
    btnConfirmarCodigo.disabled = true;
  }

  try {
    const resposta =
      await fetch(
        `${API_URL}/auth/register-company/confirm-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body:
            JSON.stringify({
              verificacaoId:
                cadastroVerificacaoId,

              codigo
            })
        }
      );

    const dados =
      await resposta
        .json()
        .catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
        "Não foi possível confirmar o código."
      );
    }

    clearInterval(reenvioInterval);

    cadastroPendente = dados;

    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        textoAcesso("emailConfirmedFaceNext");

      mensagemCadastro.className =
        "message sucesso";
    }

    modoFace = "cadastro";

    await abrirCameraFace();

  } catch (erro) {
    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        mensagemTraduzida(erro.message);

      mensagemCadastro.className =
        "message erro";
    }

  } finally {
    if (btnConfirmarCodigo) {
      btnConfirmarCodigo.disabled = false;
    }
  }
}


async function reenviarCodigoCadastroSeguro() {
  if (!cadastroVerificacaoId) {
    return;
  }

  try {
    const resposta =
      await fetch(
        `${API_URL}/auth/register-company/resend-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body:
            JSON.stringify({
              verificacaoId:
                cadastroVerificacaoId
            })
        }
      );

    const dados =
      await resposta
        .json()
        .catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
        "Não foi possível reenviar o código."
      );
    }

    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        dados.mensagem ||
        textoAcesso("newCodeSent");

      mensagemCadastro.className =
        "message sucesso";
    }

    iniciarContagemReenvio(
      dados.aguardeReenvioSegundos || 60
    );

  } catch (erro) {
    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        mensagemTraduzida(erro.message);

      mensagemCadastro.className =
        "message erro";
    }
  }
}


codigoCadastro?.addEventListener(
  "input",
  () => {
    codigoCadastro.value =
      codigoCadastro.value
        .replace(/\D/g, "")
        .slice(0, 6);
  }
);

btnConfirmarCodigo?.addEventListener(
  "click",
  confirmarCodigoCadastroSeguro
);

btnReenviarCodigo?.addEventListener(
  "click",
  reenviarCodigoCadastroSeguro
);

btnEditarCadastro?.addEventListener(
  "click",
  voltarEdicaoCadastroSeguro
);


// ========================================================
// CADASTRAR EMPRESA
// ========================================================

cadastroForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (cadastroVerificacaoId) {
      await confirmarCodigoCadastroSeguro();
      return;
    }

    await solicitarCodigoCadastroSeguro();
  }
);




function limparTimeoutLivenessMovimento() {

  if (livenessMovementTimer) {
    clearTimeout(livenessMovementTimer);
    livenessMovementTimer = null;
  }

}


function mensagemFalhaMovimento() {

  const alvo =
    modoFace === "cadastro"
      ? mensagemCadastro
      : mensagem;

  if (alvo) {
    alvo.textContent =
      textoAcesso("livenessMovementTimeoutRetry");

    alvo.className =
      "message erro";
  }

  const btnRefazer =
    document.getElementById("btnRefazerFaceCadastro");

  if (btnRefazer && modoFace === "cadastro") {
    btnRefazer.hidden = false;
  }

}


function falharLivenessPorImobilidade() {

  if (
    etapaLiveness !== "movimento" ||
    autenticando ||
    !faceModal.classList.contains("ativo")
  ) {
    return;
  }

  limparTimeoutLivenessMovimento();

  framesCorretos = 0;
  etapaLiveness = "frontal";
  livenessConfirmado = false;
  livenessBlob = null;
  frontalInicialBlob = null;
  autenticando = false;
  analisando = false;

  pararCamera();

  faceModal.classList.remove("ativo");

  mensagemFalhaMovimento();

}


function iniciarTimeoutLivenessMovimento() {

  limparTimeoutLivenessMovimento();

  livenessMovementTimer =
    setTimeout(
      falharLivenessPorImobilidade,
      LIVENESS_MOVEMENT_TIMEOUT_MS
    );

}


// ========================================================
// BOTÃO LOGIN FACIAL
// ========================================================

async function abrirFaceId() {

  modoFace =
    "login";


  cadastroPendente =
    null;


  await abrirCameraFace();

}


// ========================================================
// ABRIR CAMERA
// ========================================================

async function abrirCameraFace() {

  limparTimeoutLivenessMovimento();

  const btnRefazer =
    document.getElementById("btnRefazerFaceCadastro");

  if (btnRefazer) {
    btnRefazer.hidden = true;
  }

  faceModal.classList.add(
    "ativo"
  );


  cameraLoading.style.display =
    "flex";


  framesCorretos =
    0;

  etapaLiveness =
    "frontal";

  livenessConfirmado =
    false;

  livenessBlob =
    null;

  frontalInicialBlob =
    null;


  autenticando =
    false;


  alterarStatus(

    "analisando",

    textoAcesso("cameraStarting"),

    textoAcesso("cameraWait")

  );


  try {

    faceStream =
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

          audio:
            false

        });


    faceVideo.srcObject =
      faceStream;


    await faceVideo.play();


    cameraLoading.style.display =
      "none";


    alterarStatus(

      "analisando",

      textoAcesso("faceSearching"),

      textoAcesso("faceCenter")

    );


    iniciarAnalise();


  } catch (erro) {

    console.error(
      erro
    );


    cameraLoading.style.display =
      "none";


    alterarStatus(

      "erro",

      textoAcesso("cameraUnavailable"),

      textoAcesso("cameraPermission")

    );

  }

}


// ========================================================
// INICIAR ANALISE
// ========================================================

function iniciarAnalise() {

  if (faceInterval) {

    clearInterval(
      faceInterval
    );

  }


  analisarFrame();


  faceInterval =
    setInterval(

      analisarFrame,

      600

    );

}


// ========================================================
// CAPTURAR FRAME
// ========================================================

async function capturarBlob() {

  if (
    !faceVideo.videoWidth ||
    !faceVideo.videoHeight
  ) {

    return null;

  }


  const largura =
    640;


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
    captureCanvas
      .getContext("2d");


  ctx.drawImage(

    faceVideo,

    0,
    0,

    largura,
    altura

  );


  return new Promise(

    (resolve) => {

      captureCanvas.toBlob(

        resolve,

        "image/jpeg",

        0.88

      );

    }

  );

}


// ========================================================
// ANALISAR
// ========================================================

async function analisarFrame() {

  if (
    analisando ||
    autenticando
  ) {

    return;

  }


  analisando =
    true;


  try {

    const blob =
      await capturarBlob();


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

          method:
            "POST",

          body:
            form

        }

      );


    const dados =
      await resposta.json();


    if (!resposta.ok) {

      throw new Error(
        dados.detail
      );

    }


    atualizarDeteccao(
      dados
    );


    const yaw =
      Number(
        dados?.pose?.yaw
      );


    // ====================================================
    // PROVA DE VIDA SIMPLES
    // ====================================================

    if (
      etapaLiveness ===
      "movimento"
    ) {

      if (
        Number.isFinite(yaw) &&
        Math.abs(yaw) >= 12
      ) {

        limparTimeoutLivenessMovimento();

        livenessConfirmado =
          true;

        livenessBlob =
          blob;

        etapaLiveness =
          "retorno";

        framesCorretos =
          0;

        alterarStatus(
          "sucesso",
          textoAcesso("movementConfirmed"),
          textoAcesso("lookFrontAgain")
        );

      } else {

        alterarStatus(
          "analisando",
          textoAcesso("livenessCheck"),
          textoAcesso("turnHeadTimed", { segundos: 8 })
        );

      }

      return;
    }


    if (!dados.pronto) {

      framesCorretos =
        0;

      return;
    }


    framesCorretos++;


    if (
      etapaLiveness ===
      "frontal"
    ) {

      alterarStatus(
        "sucesso",
        textoAcesso("correctPosition"),
        textoAcesso("stayStillCount", { atual: framesCorretos })
      );


      if (
        framesCorretos >= 2
      ) {

        if (blob) {
          frontalInicialBlob = blob;
        }

        etapaLiveness =
          "movimento";

        framesCorretos =
          0;

        iniciarTimeoutLivenessMovimento();

        alterarStatus(
          "analisando",
          textoAcesso("livenessCheck"),
          textoAcesso("turnHeadTimed", { segundos: 8 })
        );

      }

      return;
    }


    if (
      etapaLiveness ===
      "retorno"
    ) {

      alterarStatus(
        "sucesso",
        textoAcesso("livenessComplete"),
        textoAcesso("lookCameraCount", { atual: framesCorretos })
      );


      if (
        livenessConfirmado &&
        framesCorretos >= 2
      ) {

        await executarReconhecimento();

      }

    }


  } catch (erro) {

    console.error(
      erro
    );


    framesCorretos =
      0;


    alterarStatus(

      "erro",

      textoAcesso("analysisFailed"),

      textoAcesso("checkPythonApi")

    );


  } finally {

    analisando =
      false;

  }

}


// ========================================================
// ATUALIZAR DETECCAO
// ========================================================

function atualizarDeteccao(
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


  if (!dados.pronto) {

    const tipo =
      dados.tipoOrientacao ===
      "erro"
        ? "erro"
        : "analisando";


    alterarStatus(

      tipo,

      dados.detectado
        ? textoAcesso("adjustPosition")
        : textoAcesso("faceSearching"),

      mensagemTraduzida(dados.orientacao)

    );

  }

}


// ========================================================
// GERAR EMBEDDING E AUTENTICAR
// ========================================================

async function executarReconhecimento() {

  limparTimeoutLivenessMovimento();

  if (autenticando) {

    return;

  }


  autenticando =
    true;


  alterarStatus(

    "analisando",

    textoAcesso("checkingIdentity"),

    textoAcesso("doNotMove")

  );


  try {

    const blob =
      await capturarBlob();


    const form =
      new FormData();


    form.append(
      "imagem",
      blob,
      "face.jpg"
    );

    if (
      modoFace === "cadastro" &&
      frontalInicialBlob
    ) {
      form.append(
        "inicial",
        frontalInicialBlob,
        "inicial.jpg"
      );
    }


    if (livenessBlob) {
      form.append(
        "liveness",
        livenessBlob,
        "liveness.jpg"
      );
    }


    if (
      modoFace ===
      "cadastro"
    ) {

      await cadastrarFace(
        form
      );

    } else {

      await autenticarFace(
        form
      );

    }


  } catch (erro) {

    alterarStatus(

      "erro",

      textoAcesso("validationFailed"),

      mensagemTraduzida(erro.message)

    );


    framesCorretos =
      0;

    if (modoFace === "cadastro") {
      etapaLiveness = "frontal";
      livenessConfirmado = false;
      livenessBlob = null;
      frontalInicialBlob = null;
    }

    setTimeout(
      () => {

        autenticando =
          false;

        if (modoFace === "cadastro") {
          alterarStatus(
            "analisando",
            textoAcesso("faceSearching"),
            textoAcesso("registrationFaceRetry")
          );
        }

      },

      1400
    );

  }

}


// ========================================================
// CADASTRAR FACE
// ========================================================

async function cadastrarFace(
  form
) {

  const verificacaoId =
    cadastroPendente?.verificacaoId ||
    cadastroVerificacaoId;

  if (!verificacaoId) {
    throw new Error(
      "A verificação do cadastro expirou. Confirme o e-mail novamente."
    );
  }

  form.append(
    "verificacaoId",
    verificacaoId
  );

  const resposta =
    await fetch(
      `${API_URL}/auth/register-company/complete-face`,
      {
        method:
          "POST",

        body:
          form
      }
    );


  const dados =
    await resposta
      .json()
      .catch(() => ({}));


  if (!resposta.ok) {
    throw new Error(
      dados.mensagem ||
      "A biometria não foi concluída. A conta ainda não foi criada; faça a facial novamente."
    );
  }


  alterarStatus(
    "sucesso",
    textoAcesso("faceRegisteredTitle"),
    textoAcesso("faceRegisteredText")
  );


  cadastroPendente = dados;

  salvarSessao(
    dados
  );


  pararCamera();


  mostrarBoasVindas({
    titulo: textoAcesso(
      "registerWelcomeTitle",
      { nome: dados?.usuario?.nome || "" }
    ),
    texto: textoAcesso("registerWelcomeText"),
    cadastro: true
  });


  setTimeout(
    () => {
      window.location.href =
        "/app/maquinas";
    },
    700
  );

}



// ========================================================
// SEGUNDO FATOR PARA IDENTIDADE FACIAL AMBIGUA
// ========================================================

function fecharSegundoFatorFacial() {
  document
    .querySelector(".face-2fa-overlay")
    ?.remove();
}

async function abrirSegundoFatorFacial(challengeId) {
  if (!challengeId) return;

  limparTimeoutLivenessMovimento();
  pararCamera();
  faceModal?.classList.remove("ativo");
  autenticando = false;
  analisando = false;

  fecharSegundoFatorFacial();

  const overlay = document.createElement("div");
  overlay.className = "face-2fa-overlay";
  overlay.innerHTML = `
    <section class="face-2fa-card" role="dialog" aria-modal="true" aria-labelledby="face2faTitle">
      <button type="button" class="face-2fa-close" aria-label="Fechar">×</button>
      <div class="face-2fa-icon"><i class="fa-solid fa-shield-halved"></i></div>
      <span class="face-2fa-kicker">STEELCONTROL • SEGUNDO FATOR</span>
      <h2 id="face2faTitle">${textoAcesso("ambiguousIdentity")}</h2>
      <p class="face-2fa-description">${textoAcesso("face2faDescription")}</p>

      <div class="face-2fa-step face-2fa-email-step">
        <label for="face2faEmail">${textoAcesso("face2faEmail")}</label>
        <input id="face2faEmail" type="email" autocomplete="email" placeholder="nome@empresa.com">
        <button type="button" class="face-2fa-primary face-2fa-send">${textoAcesso("face2faSend")}</button>
      </div>

      <div class="face-2fa-step face-2fa-code-step" hidden>
        <div class="face-2fa-sent"></div>
        <label for="face2faCode">${textoAcesso("face2faCode")}</label>
        <input id="face2faCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">
        <button type="button" class="face-2fa-primary face-2fa-verify">${textoAcesso("face2faVerify")}</button>
        <button type="button" class="face-2fa-link face-2fa-back">${textoAcesso("face2faOtherEmail")}</button>
      </div>

      <div class="face-2fa-message" aria-live="polite"></div>
      <small class="face-2fa-security">${textoAcesso("face2faSecurity")}</small>
    </section>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("is-visible"));

  const emailInput = overlay.querySelector("#face2faEmail");
  const codeInput = overlay.querySelector("#face2faCode");
  const emailStep = overlay.querySelector(".face-2fa-email-step");
  const codeStep = overlay.querySelector(".face-2fa-code-step");
  const message = overlay.querySelector(".face-2fa-message");
  const sent = overlay.querySelector(".face-2fa-sent");
  const sendButton = overlay.querySelector(".face-2fa-send");
  const verifyButton = overlay.querySelector(".face-2fa-verify");

  const setMessage = (text, error = false) => {
    message.textContent = text || "";
    message.classList.toggle("is-error", Boolean(error));
  };

  overlay.querySelector(".face-2fa-close")?.addEventListener("click", fecharSegundoFatorFacial);

  overlay.querySelector(".face-2fa-back")?.addEventListener("click", () => {
    codeStep.hidden = true;
    emailStep.hidden = false;
    codeInput.value = "";
    setMessage("");
    emailInput.focus();
  });

  sendButton?.addEventListener("click", async () => {
    const email = String(emailInput.value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setMessage(textoAcesso("face2faInvalidEmail"), true);
      emailInput.focus();
      return;
    }

    sendButton.disabled = true;
    setMessage(textoAcesso("face2faSending"));

    try {
      const resposta = await fetch(`${API_URL}/auth/face/ambiguous/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, email })
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível enviar o código.");

      sent.textContent = `Código enviado para ${dados.email || "o e-mail confirmado"}.`;
      emailStep.hidden = true;
      codeStep.hidden = false;
      setMessage("");
      codeInput.focus();
    } catch (erro) {
      setMessage(erro.message || "Não foi possível enviar o código.", true);
    } finally {
      sendButton.disabled = false;
    }
  });

  verifyButton?.addEventListener("click", async () => {
    const email = String(emailInput.value || "").trim().toLowerCase();
    const codigo = String(codeInput.value || "").replace(/\D/g, "").slice(0, 6);

    if (codigo.length !== 6) {
      setMessage(textoAcesso("face2faInvalidCode"), true);
      codeInput.focus();
      return;
    }

    verifyButton.disabled = true;
    setMessage(textoAcesso("face2faConfirming"));

    try {
      const resposta = await fetch(`${API_URL}/auth/face/ambiguous/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, email, codigo })
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Código inválido.");

      salvarSessao(dados);
      fecharSegundoFatorFacial();
      mostrarBoasVindas({
        titulo: textoAcesso("faceRecognizedTitle"),
        texto: textoAcesso("faceRecognizedText", { nome: dados?.usuario?.nome || "" }),
        cadastro: false
      });
      setTimeout(() => {
        window.location.href = "/app/maquinas";
      }, 700);
    } catch (erro) {
      setMessage(erro.message || "Não foi possível confirmar a identidade.", true);
    } finally {
      verifyButton.disabled = false;
    }
  });

  emailInput?.focus();
}


// ========================================================
// LOGIN FACIAL
// ========================================================

async function autenticarFace(
  form
) {

  const resposta =
    await fetch(
      `${API_URL}/auth/face/login-image`,
      {
        method:
          "POST",
        body:
          form
      }
    );


  const dados =
    await resposta
      .json()
      .catch(() => ({}));


  if (!resposta.ok) {

    if (
      dados.codigo === "FACE_AMBIGUOUS" &&
      dados.segundoFator === true &&
      dados.challengeId
    ) {
      alterarStatus(
        "analisando",
        textoAcesso("ambiguousIdentity"),
        "Confirmação adicional necessária."
      );
      await abrirSegundoFatorFacial(dados.challengeId);
      return;
    }

    if (
      dados.codigo ===
      "FACE_NOT_REGISTERED" ||
      dados.codigo ===
      "FACE_AMBIGUOUS" ||
      dados.codigo ===
      "LIVENESS_FAILED" ||
      dados.codigo ===
      "LIVENESS_REQUIRED"
    ) {

      alterarStatus(
        "erro",
        dados.codigo === "FACE_AMBIGUOUS"
          ? textoAcesso("ambiguousIdentity")
          : textoAcesso("faceNotRegistered"),
        mensagemTraduzida(dados.orientacao) ||
        textoAcesso("faceNotFoundSecurely")
      );


      framesCorretos =
        0;


      setTimeout(
        () => {
          autenticando =
            false;
        },
        2500
      );


      return;
    }


    throw new Error(
      dados.mensagem ||
      "Reconhecimento recusado."
    );
  }


  alterarStatus(
    "sucesso",
    textoAcesso("faceRecognizedTitle"),
    textoAcesso(
      "faceRecognizedText",
      { nome: dados.usuario.nome }
    )
  );


  salvarSessao(
    dados
  );


  pararCamera();


  mostrarBoasVindas({
    titulo: textoAcesso(
      "loginWelcomeTitle",
      { nome: dados.usuario.nome }
    ),
    texto: textoAcesso("loginWelcomeText")
  });


  setTimeout(
    () => {
      window.location.href =
        "/app/maquinas";
    },
    2000
  );

}



// ========================================================
// QUADRADO VERDE
// ========================================================

function desenharQuadrado(
  bbox,
  larguraImagem,
  alturaImagem
) {

  const largura =
    faceVideo.clientWidth;

  const altura =
    faceVideo.clientHeight;


  faceOverlay.width =
    largura;

  faceOverlay.height =
    altura;


  const ctx =
    faceOverlay
      .getContext("2d");


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


  const x =
    largura -
    x2;


  const y =
    offsetY +
    bbox.y1 *
    escala;


  const boxWidth =
    x2 - x1;


  const boxHeight =
    (
      bbox.y2 -
      bbox.y1
    ) *
    escala;


  ctx.strokeStyle =
    "#22c55e";


  ctx.lineWidth =
    4;


  ctx.shadowColor =
    "#22c55e";


  ctx.shadowBlur =
    15;


  ctx.strokeRect(

    x,
    y,

    boxWidth,
    boxHeight

  );

}


// ========================================================
// LIMPAR QUADRADO
// ========================================================

function limparQuadrado() {

  const ctx =
    faceOverlay
      .getContext("2d");


  ctx.clearRect(

    0,
    0,

    faceOverlay.width,
    faceOverlay.height

  );

}


// ========================================================
// STATUS
// ========================================================

function alterarStatus(
  tipo,
  titulo,
  texto
) {

  faceStatus.className =
    `face-status ${tipo} face-status-flutter face-command-status`;


  faceStatusTitulo.textContent =
    titulo;


  faceStatusTexto.textContent =
    texto;


  atualizarConsoleFacialDesktop(tipo, titulo);

}


function atualizarConsoleFacialDesktop(tipo = "analisando", titulo = "") {

  const etapas = ["frontal", "movimento", "retorno", "verificacao"];
  const etapaAtual = autenticando
    ? "verificacao"
    : (etapaLiveness || "frontal");

  const indiceAtual = Math.max(0, etapas.indexOf(etapaAtual));

  document.querySelectorAll("[data-face-step]").forEach((item) => {
    const indice = etapas.indexOf(item.dataset.faceStep);
    item.classList.toggle("complete", indice >= 0 && indice < indiceAtual);
    item.classList.toggle("active", indice === indiceAtual);
  });

  const progresso = document.getElementById("faceCommandProgress");
  if (progresso) {
    const valores = [18, 46, 72, 90];
    progresso.style.width = `${tipo === "erro" ? Math.max(8, valores[indiceAtual] - 8) : valores[indiceAtual]}%`;
    progresso.style.background = tipo === "erro"
      ? "#e25555"
      : tipo === "sucesso" && etapaAtual === "verificacao"
        ? "#22a96b"
        : "linear-gradient(90deg, #b86d09, #e1a03d)";
  }

  const estado = document.getElementById("faceCommandState");
  if (estado) {
    estado.classList.toggle("error", tipo === "erro");
    const label = estado.querySelector("span");
    if (label && titulo) label.textContent = titulo;
  }
}


// ========================================================
// FECHAR FACE
// ========================================================

function fecharFaceId() {

  pararCamera();

  faceModal.classList.remove(
    "ativo"
  );

  if (
    modoFace === "cadastro" &&
    cadastroPendente?.contaCriada === false
  ) {
    if (mensagemCadastro) {
      mensagemCadastro.textContent =
        textoAcesso("registrationFaceRequired");
      mensagemCadastro.className =
        "message erro";
    }
  }

}


// ========================================================
// PARAR CAMERA
// ========================================================

function pararCamera() {

  limparTimeoutLivenessMovimento();

  if (faceInterval) {

    clearInterval(
      faceInterval
    );


    faceInterval =
      null;

  }


  if (faceStream) {

    faceStream
      .getTracks()
      .forEach(

        track =>
          track.stop()

      );


    faceStream =
      null;

  }


  faceVideo.srcObject =
    null;


  analisando =
    false;

}




const btnRefazerFaceCadastro =
  document.getElementById("btnRefazerFaceCadastro");

if (btnRefazerFaceCadastro) {
  btnRefazerFaceCadastro.addEventListener(
    "click",
    async () => {
      modoFace = "cadastro";
      btnRefazerFaceCadastro.hidden = true;
      await abrirCameraFace();
    }
  );
}


// ========================================================
// CLICK FORA
// ========================================================

faceModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      faceModal
    ) {

      fecharFaceId();

    }

  }
);


// ========================================================
// ESC
// ========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      if (
        faceModal.classList.contains(
          "ativo"
        )
      ) {

        fecharFaceId();

      }

    }

  }
);
