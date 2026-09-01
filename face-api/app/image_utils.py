"""Operacoes de imagem pequenas e deterministicas usadas pela Face API."""

import cv2
import numpy as np


def decodificar_imagem(conteudo: bytes) -> np.ndarray | None:
    """Decodifica bytes em uma imagem BGR ou retorna ``None``."""

    if not conteudo:
        return None

    dados = np.frombuffer(conteudo, np.uint8)
    return cv2.imdecode(dados, cv2.IMREAD_COLOR)


def medir_brilho(frame: np.ndarray) -> float:
    """Calcula o brilho medio em escala de cinza."""

    cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(np.mean(cinza))

