# Versão congelada para o TCC

Esta entrega usa `CODE_FREEZE.sha256` para detectar divergências dos arquivos funcionais em relação ao manifesto da release.

Antes da apresentação:
1. `npm run quality`
2. Validar PostgreSQL + migrations + E2E em ambiente limpo.
3. Testar Gmail, Face API e câmera reais.
4. Testar ESP32/Dobot somente no modo e hardware planejados.
5. Guardar o ZIP final e o commit Git correspondente.

O freeze detecta alterações acidentais; não substitui assinatura criptográfica de artefatos nem cadeia de supply-chain.
