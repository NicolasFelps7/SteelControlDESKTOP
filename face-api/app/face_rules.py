"""Regras puras da Face API.

Este modulo nao carrega o modelo InsightFace. Assim, as validacoes podem ser
testadas rapidamente sem baixar o buffalo_l ou inicializar o ONNX Runtime.
"""

from collections.abc import Sequence
from math import isfinite, sqrt


TIPOS_IMAGEM_PERMITIDOS = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_IMAGE_BYTES = 4 * 1024 * 1024
TAMANHO_EMBEDDING = 512


def validar_metadados_upload(
    content_type: str | None,
    tamanho_bytes: int,
) -> tuple[int, str] | None:
    """Retorna ``(status HTTP, mensagem)`` quando o upload for invalido."""

    if content_type not in TIPOS_IMAGEM_PERMITIDOS:
        return 415, "Formato de imagem nao suportado."

    if tamanho_bytes <= 0:
        return 400, "Imagem vazia."

    if tamanho_bytes > MAX_IMAGE_BYTES:
        return 413, "Imagem maior que o limite de 4 MB."

    return None


def limitar_bbox(
    bbox: Sequence[float],
    largura: int,
    altura: int,
) -> tuple[int, int, int, int]:
    """Mantem a caixa facial dentro dos limites da imagem."""

    x1, y1, x2, y2 = (int(valor) for valor in bbox)

    return (
        max(0, min(x1, largura)),
        max(0, min(y1, altura)),
        max(0, min(x2, largura)),
        max(0, min(y2, altura)),
    )


def embedding_valido(
    embedding: Sequence[float] | None,
    tamanho_esperado: int = TAMANHO_EMBEDDING,
) -> bool:
    """Valida dimensao, numeros finitos e norma de um embedding facial."""

    if embedding is None or len(embedding) != tamanho_esperado:
        return False

    try:
        numeros = [float(valor) for valor in embedding]
    except (TypeError, ValueError):
        return False

    if not all(isfinite(valor) for valor in numeros):
        return False

    norma = sqrt(sum(valor * valor for valor in numeros))
    return norma > 0

