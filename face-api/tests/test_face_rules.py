import math
import unittest

from app.face_rules import (
    MAX_IMAGE_BYTES,
    embedding_valido,
    limitar_bbox,
    validar_metadados_upload,
)


class FaceRulesTest(unittest.TestCase):
    def test_upload_jpeg_valido(self):
        self.assertIsNone(
            validar_metadados_upload("image/jpeg", 1024)
        )

    def test_upload_rejeita_formato_nao_permitido(self):
        erro = validar_metadados_upload("application/pdf", 1024)
        self.assertEqual(erro[0], 415)

    def test_upload_rejeita_imagem_vazia(self):
        erro = validar_metadados_upload("image/png", 0)
        self.assertEqual(erro[0], 400)

    def test_upload_rejeita_arquivo_acima_do_limite(self):
        erro = validar_metadados_upload(
            "image/webp",
            MAX_IMAGE_BYTES + 1,
        )
        self.assertEqual(erro[0], 413)

    def test_bbox_fica_dentro_da_imagem(self):
        self.assertEqual(
            limitar_bbox((-20, -5, 900, 700), 640, 480),
            (0, 0, 640, 480),
        )

    def test_embedding_insightface_valido(self):
        embedding = [0.0] * 511 + [1.0]
        self.assertTrue(embedding_valido(embedding))

    def test_embedding_rejeita_dimensao_incorreta(self):
        self.assertFalse(embedding_valido([1.0, 0.0]))

    def test_embedding_rejeita_nan(self):
        embedding = [0.0] * 511 + [math.nan]
        self.assertFalse(embedding_valido(embedding))

    def test_embedding_rejeita_vetor_sem_norma(self):
        self.assertFalse(embedding_valido([0.0] * 512))


if __name__ == "__main__":
    unittest.main()

