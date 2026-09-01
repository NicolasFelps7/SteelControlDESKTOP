# SECURITY — SteelControl

## Modelo de ameaça resumido

### Autenticação
- Tokens JWT são assinados com segredo obrigatório.
- O backend consulta o usuário atual no banco em toda rota protegida.
- Usuários desativados perdem acesso mesmo que ainda possuam token não expirado.
- Cargo e `empresaId` vêm do banco, não são confiados ao conteúdo antigo do token.

### Multi-tenant
Consultas de máquinas, funcionários e manutenção sempre devem filtrar por `empresaId`.

### E-mail
Códigos:
- 6 dígitos;
- validade limitada;
- limite de tentativas;
- limite de reenvio;
- rate limit por IP/e-mail;
- código armazenado em hash durante o período pendente.

### Biometria
Fluxo recomendado:
`Browser -> Node -> Python -> Node`.

O browser envia imagens, e não embeddings tratados como confiáveis.

No login:
1. usuário olha para a câmera;
2. move a cabeça;
3. retorna à posição frontal;
4. o backend recebe imagem de prova de vida + imagem frontal;
5. o backend valida o movimento usando a Face API;
6. o backend gera o embedding final;
7. a comparação acontece no Node.

### Limitações
A prova de vida por movimento é uma proteção de demonstração e não equivale a detecção anti-spoofing certificada.

### LGPD
Embeddings faciais são dados biométricos sensíveis. Para produção:
- consentimento explícito;
- política de finalidade;
- retenção mínima;
- exclusão/revogação;
- criptografia em repouso;
- controle de acesso;
- trilha de auditoria;
- avaliação jurídica/LGPD.
