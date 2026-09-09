# Facial Desktop — timeout de prova de vida

- A etapa de movimento agora possui limite de 8 segundos.
- Se o usuário não movimentar a cabeça dentro do tempo, a câmera é encerrada e o modal facial é fechado.
- A tela exibe mensagem clara solicitando uma nova tentativa.
- No cadastro, aparece o botão **Refazer biometria facial** sem exigir novo cadastro dos dados.
- O movimento confirmado cancela imediatamente o timeout.
- A regra de liveness do backend e a Face API não foram relaxadas.
