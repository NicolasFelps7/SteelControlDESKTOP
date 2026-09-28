import { prisma } from "../src/lib/prisma.js";
import { criptografarJsonSensivel } from "../src/lib/sensitiveData.js";

let updated = 0;

try {
  const faces = await prisma.faceEmbedding.findMany({
    select: { id: true, embedding: true }
  });

  for (const face of faces) {
    if (face.embedding?.encrypted === true) continue;
    await prisma.faceEmbedding.update({
      where: { id: face.id },
      data: { embedding: criptografarJsonSensivel(face.embedding) }
    });
    updated += 1;
  }

  console.log(JSON.stringify({ ok: true, scanned: faces.length, encrypted: updated }));
} finally {
  await prisma.$disconnect();
}
