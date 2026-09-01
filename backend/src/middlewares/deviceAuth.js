import { prisma } from "../lib/prisma.js";
import { compararDeviceKey } from "../lib/deviceSecurity.js";

export async function deviceRequired(req, res, next) {
  try {
    const maquinaId = Number(req.params.id);
    const chave = String(req.headers["x-device-key"] || "").trim();

    if (!Number.isInteger(maquinaId) || !chave) {
      return res.status(401).json({
        mensagem: "Credencial do equipamento ausente ou inválida."
      });
    }

    const maquina = await prisma.maquina.findFirst({
      where: {
        id: maquinaId,
        ativo: true
      }
    });

    if (
      !maquina ||
      !maquina.deviceKeyHash ||
      !compararDeviceKey(chave, maquina.deviceKeyHash)
    ) {
      return res.status(401).json({
        mensagem: "Credencial do equipamento inválida."
      });
    }

    req.device = {
      maquina,
      maquinaId: maquina.id,
      empresaId: maquina.empresaId
    };

    next();
  } catch (erro) {
    next(erro);
  }
}
