# SteelControl — Identidade Visual Industrial

Atualização visual preparada para apresentação do TCC em contexto de fábrica, sem alteração das regras funcionais do sistema.

## Direção visual

- **Grafite e aço**: base neutra para transmitir robustez, chão de fábrica e software técnico.
- **Âmbar industrial**: cor de ação e destaque principal, inspirada em sinalização e equipamentos industriais.
- **Verde**: reservado para operação normal, conexão e sucesso.
- **Vermelho**: reservado para falha, alerta crítico e ações destrutivas.
- **Amarelo/âmbar**: manutenção, atenção e informação operacional relevante.

## Paleta principal

- Grafite profundo: `#15181A`
- Grafite: `#1D2124`
- Aço médio: `#606A72`
- Fundo técnico claro: `#F1F3F4`
- Borda aço: `#CFD5D9`
- Âmbar principal: `#C47B12`
- Âmbar escuro: `#9E600A`
- Verde operacional: `#2F7D4A`
- Vermelho crítico: `#B43B35`

## Ajustes aplicados

- Remoção do azul SaaS dominante e dos tons azul-marinho do tema escuro.
- Sidebar do dashboard em grafite técnico, com seleção ativa por faixa âmbar.
- Cards com bordas mais firmes, raios menores e sombras mais discretas.
- Home e login com fundos técnicos em grade, sem depender de imagem externa.
- Tela de máquinas com hero industrial, destaque âmbar e cards mais sóbrios.
- IHM com acabamento de console industrial escuro.
- Tema escuro neutralizado para grafite/cinza em vez de azul-marinho.
- Estados operacionais verde/vermelho preservados semanticamente.

## Arquivo de acabamento

A camada final fica em:

`frontend/assets/css/industrial-pro.css`

Ela é carregada por último nas cinco páginas do frontend para manter a alteração visual isolada e reduzir risco de regressão funcional.
