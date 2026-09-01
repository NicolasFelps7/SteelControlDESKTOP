# Front-end SteelControl

Estrutura organizada:

- `*.html`: páginas principais.
- `assets/css/base.css`: fonte global neutra e componentes compartilhados.
- `assets/css/*.css`: estilos específicos de cada página.
- `assets/js/config.js`: idioma e tema globais.
- `assets/js/*.js`: lógica específica de cada página.
- `assets/img/`: imagens e logos.

## Idiomas

O idioma escolhido é salvo em `localStorage` usando a chave `idiomaSistema`.
O `config.js` é carregado em todas as páginas antes do JavaScript específico
e aplica a tradução tanto em elementos com `data-i18n` quanto em textos
estáticos reconhecidos pela tabela global.

Idiomas disponíveis: PT, EN, ES, FR, DE e IT.

## Fonte

O projeto usa Arial/Helvetica/sans-serif como tipografia global, sem fontes
decorativas ou fontes geradas externamente.
