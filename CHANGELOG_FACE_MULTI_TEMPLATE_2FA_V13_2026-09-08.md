# SteelControl — Face Multi-Template + Segundo Fator V13

Data: 2026-09-08

## O que mudou

- Cada identidade facial continua usando **um único registro FaceEmbedding por usuário**, porém esse registro pode armazenar **até 3 templates internos**: frontal inicial, movimento/liveness e frontal final.
- O formato antigo `embedding: [512 valores]` continua aceito. Não é necessária migration Prisma para essa mudança.
- O reconhecimento agrupa templates por usuário e usa consenso entre as melhores evidências, evitando que templates do mesmo perfil sejam tratados como identidades concorrentes.
- A proteção contra rosto duplicado compara todas as capturas de enrollment contra todos os templates já cadastrados.
- Enrollment de funcionário e criação inicial de empresa enviam as capturas inicial, liveness e final ao backend.
- Se duas identidades ficarem próximas demais (`FACE_AMBIGUOUS`), o sistema **não escolhe automaticamente**. Um desafio temporário de segundo fator é criado.
- O segundo fator exige o e-mail de um dos candidatos biométricos e envia código de 6 dígitos via Nodemailer/Gmail.
- O desafio expira em 5 minutos, possui limite de tentativas/envios e armazena o código somente como hash bcrypt.
- O cliente não recebe nomes/e-mails dos candidatos biométricos; somente um `challengeId` opaco.
- Desktop e Mobile possuem fluxo de confirmação por código para ambiguidade facial.
- A auditoria de possíveis duplicidades foi atualizada para comparar múltiplos templates.

## Compatibilidade

Biometrias já cadastradas continuam válidas com um template legado. Para aproveitar os 3 templates, o perfil deve remover e cadastrar novamente sua facial.

## Infraestrutura

O desafio de segundo fator está em memória no processo Node, adequado ao ambiente local/TCC de instância única. Em produção com múltiplas réplicas do backend, mover o challenge store para Redis ou armazenamento compartilhado com TTL.

## Segurança

Esta evolução reduz dependência de uma única captura e adiciona verificação adicional em casos ambíguos. Ela não torna biometria infalível. Ambientes de criticidade máxima devem considerar anti-spoof/liveness dedicado com IR/depth e calibração FAR/FRR com dados representativos.
