import { enviarEmailTeste, verificarConfiguracaoEmail } from "../src/lib/mailer.js";

try {
  const status = await verificarConfiguracaoEmail();
  console.log(`Gmail autenticado com sucesso: ${status.email}`);

  await enviarEmailTeste();
  console.log("E-mail de teste enviado. Confira a caixa de entrada (e Spam). ");
  process.exit(0);
} catch (erro) {
  console.error("Falha no e-mail SteelControl:");
  console.error(erro?.message || erro);
  process.exit(1);
}
