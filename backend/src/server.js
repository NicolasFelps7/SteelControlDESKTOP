import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { startDeviceDiscovery, stopDeviceDiscovery } from "./lib/deviceDiscovery.js";

let server;
let encerrando = false;

async function encerrar(
  sinal
) {
  if (encerrando) {
    return;
  }

  encerrando = true;

  console.log(
    `Recebido ${sinal}. Encerrando SteelControl com segurança...`
  );

  const finalizar =
    async () => {
      stopDeviceDiscovery();

      await prisma
        .$disconnect()
        .catch(() => {});

      process.exit(0);
    };

  if (server) {
    server.close(
      finalizar
    );

    setTimeout(
      finalizar,
      8000
    ).unref();
  } else {
    await finalizar();
  }
}

async function iniciar() {
  try {
    await prisma.$connect();

    server =
      app.listen(
        env.port,
        "0.0.0.0",
        () => {
          console.log(
            `SteelControl iniciado na porta ${env.port}.`
          );

          console.log(
            `Ambiente: ${env.nodeEnv}.`
          );

          console.log(
            "PostgreSQL conectado com sucesso."
          );

          console.log(
            "Schema gerenciado exclusivamente por Prisma Migrations."
          );

          startDeviceDiscovery();
        }
      );
  } catch (erro) {
    console.error(
      "Não foi possível iniciar o SteelControl:",
      erro
    );

    console.error(
      "Confirme DATABASE_URL e rode `npx prisma generate` + `npx prisma migrate deploy`."
    );

    await prisma
      .$disconnect()
      .catch(() => {});

    process.exit(1);
  }
}

process.on(
  "SIGTERM",
  () =>
    encerrar(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    encerrar(
      "SIGINT"
    )
);

iniciar();
