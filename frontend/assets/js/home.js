// =====================================================
// STEELCONTROL - LANDING PAGE
// =====================================================


// =====================================================
// TEMA
// =====================================================

const themeBtn =
  document.getElementById(
    "themeBtn"
  );


function aplicarTema() {

  const tema =
    localStorage.getItem(
      "temaSistema"
    ) ||
    "claro";


  document.documentElement.setAttribute(
    "data-theme",
    tema
  );


  atualizarIconeTema(
    tema
  );

}


function atualizarIconeTema(
  tema
) {

  if (!themeBtn) {

    return;

  }


  themeBtn.innerHTML =
    tema === "escuro"

      ? '<i class="fa-solid fa-sun"></i>'

      : '<i class="fa-solid fa-moon"></i>';

}


function alternarTema() {

  const atual =
    document.documentElement.getAttribute(
      "data-theme"
    ) ||
    "claro";


  const novo =
    atual === "escuro"
      ? "claro"
      : "escuro";


  localStorage.setItem(
    "temaSistema",
    novo
  );


  document.documentElement.setAttribute(
    "data-theme",
    novo
  );


  atualizarIconeTema(
    novo
  );

}


themeBtn?.addEventListener(
  "click",
  alternarTema
);


// =====================================================
// MENU MOBILE
// =====================================================

const mobileBtn =
  document.getElementById(
    "mobileBtn"
  );

const navMenu =
  document.getElementById(
    "navMenu"
  );


mobileBtn?.addEventListener(
  "click",
  () => {

    navMenu?.classList.toggle(
      "active"
    );

  }
);


document
  .querySelectorAll(
    ".nav a"
  )
  .forEach(
    link => {

      link.addEventListener(
        "click",
        () => {

          navMenu?.classList.remove(
            "active"
          );

        }
      );

    }
  );


// =====================================================
// ANIMAÇÃO DE ENTRADA
// =====================================================

const elementosAnimados =
  document.querySelectorAll(
    ".feature-card, .about-card, .technology-grid article, .future-card, .security-list > div"
  );


elementosAnimados.forEach(
  elemento => {

    elemento.classList.add(
      "reveal"
    );

  }
);


const observer =
  new IntersectionObserver(
    entradas => {

      entradas.forEach(
        entrada => {

          if (
            entrada.isIntersecting
          ) {

            entrada.target.classList.add(
              "visible"
            );


            observer.unobserve(
              entrada.target
            );

          }

        }
      );

    },
    {

      threshold: 0.12

    }
  );


elementosAnimados.forEach(
  elemento => {

    observer.observe(
      elemento
    );

  }
);


// =====================================================
// HEADER AO ROLAR
// =====================================================

const header =
  document.querySelector(
    ".site-header"
  );


window.addEventListener(
  "scroll",
  () => {

    if (!header) {

      return;

    }


    if (
      window.scrollY > 20
    ) {

      header.style.boxShadow =
        "0 8px 30px rgba(15, 23, 42, 0.08)";

    } else {

      header.style.boxShadow =
        "none";

    }

  }
);


// =====================================================
// INICIALIZAÇÃO
// =====================================================

aplicarTema();