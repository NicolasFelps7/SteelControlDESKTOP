import unittest

try:
    import cv2
    import numpy as np
    from app.image_utils import decodificar_imagem, medir_brilho
except ModuleNotFoundError:
    cv2 = None
    np = None
    decodificar_imagem = None
    medir_brilho = None


@unittest.skipUnless(
    cv2 is not None,
    "OpenCV nao instalado; execute no venv da Face API.",
)
class ImageUtilsTest(unittest.TestCase):
    def test_decodifica_png_valido_em_bgr(self):
        original = np.zeros((12, 16, 3), dtype=np.uint8)
        original[:, :] = (10, 80, 180)
        sucesso, buffer = cv2.imencode(".png", original)

        self.assertTrue(sucesso)
        resultado = decodificar_imagem(buffer.tobytes())
        self.assertIsNotNone(resultado)
        self.assertEqual(resultado.shape, (12, 16, 3))

    def test_bytes_invalidos_nao_viram_imagem(self):
        self.assertIsNone(decodificar_imagem(b"nao-e-uma-imagem"))

    def test_brilho_preto_e_zero(self):
        frame = np.zeros((8, 8, 3), dtype=np.uint8)
        self.assertEqual(medir_brilho(frame), 0.0)

    def test_brilho_branco_e_255(self):
        frame = np.full((8, 8, 3), 255, dtype=np.uint8)
        self.assertEqual(medir_brilho(frame), 255.0)


if __name__ == "__main__":
    unittest.main()
