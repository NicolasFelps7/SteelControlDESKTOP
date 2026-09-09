# SteelControl — Facial Security V12

Data: 2026-09-08

## Objetivo

Endurecer o cadastro biométrico sem alterar o modelo InsightFace nem a arquitetura Node -> Face API -> PostgreSQL.

## Alterações

- O cadastro facial de funcionários agora exige **duas capturas**: movimento/liveness + imagem frontal final.
- O backend valida que as duas capturas pertencem à **mesma pessoa** antes do enrollment.
- O movimento precisa apresentar `|yaw| >= 12°` e a interface usa timeout de 8 segundos.
- O bloqueio de duplicidade ficou mais conservador: `FACE_DUPLICATE_THRESHOLD = 0.50` no enrollment.
- A duplicidade é comparada usando a imagem frontal **e** a captura de liveness, sob advisory lock PostgreSQL.
- Tentativas de vincular um rosto já cadastrado são registradas na auditoria como `FACE_DUPLICADA_BLOQUEADA`.
- A rota de enrollment recebeu rate limit específico.
- Quando o Desktop recebe `FACE_ALREADY_LINKED`, a câmera é parada e o modal é fechado imediatamente.
- O fluxo de criação de empresa também compara as duas capturas contra as biometrias existentes usando o limiar conservador de enrollment.
- O endpoint autenticado `/auth/face/register-image` também passou a exigir liveness.
- Foi adicionado `npm run face:audit` no backend para localizar pares biométricos já existentes com similaridade suspeita. O comando é somente diagnóstico e **não exclui dados automaticamente**.

## Limite técnico importante

Nenhum sistema biométrico pode ser honestamente declarado "100% seguro". Este patch reduz significativamente riscos de duplicidade, corrida de cadastro e enrollment sem prova de vida, mas proteção contra ataques avançados de apresentação/deepfake exige liveness/anti-spoof especializado, calibração FAR/FRR com dados reais, política LGPD e controles operacionais adequados.
