import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não foi encontrada. Confirme que backend/.env existe e contém a conexão PostgreSQL."
    );
  }

  const senhaHash = await bcrypt.hash("Steel123!", 12);

  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "11.222.333/0001-81" },
    update: {},
    create: {
      nome: "SteelControl Demonstração",
      cnpj: "11.222.333/0001-81"
    }
  });

  await prisma.usuario.upsert({
    where: { email: "admin@steelcontrol.com" },
    update: {},
    create: {
      empresaId: empresa.id,
      nome: "Administrador",
      email: "admin@steelcontrol.com",
      senhaHash,
      cargo: "ADMINISTRADOR"
    }
  });

  console.log("Usuário de teste disponível:");
  console.log("admin@steelcontrol.com / Steel123!");
}

main()
  .catch(erro => {
    console.error("Falha ao executar seed:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
