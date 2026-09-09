from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import os
import hmac

from insightface.app import FaceAnalysis

from .face_rules import (
    embedding_valido,
    limitar_bbox,
    validar_metadados_upload,
)
from .image_utils import decodificar_imagem, medir_brilho


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="SteelControl Face API",
    version="2.0.0"
)


origens_permitidas = [
    origem.strip()
    for origem in os.getenv(
        "FACE_CORS_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500"
    ).split(",")
    if origem.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# =========================================================
# AUTENTICAÇÃO SERVIÇO-A-SERVIÇO
# =========================================================

FACE_API_KEY = os.getenv(
    "FACE_API_KEY",
    ""
).strip()

STEELCONTROL_ENV = os.getenv(
    "STEELCONTROL_ENV",
    "development"
).strip().lower()

if STEELCONTROL_ENV == "production" and len(FACE_API_KEY) < 32:
    raise RuntimeError(
        "FACE_API_KEY deve possuir pelo menos 32 caracteres em produção."
    )


@app.middleware("http")
async def proteger_face_api(
    request: Request,
    call_next
):

    if request.url.path == "/health":
        return await call_next(
            request
        )

    if FACE_API_KEY:
        recebida = request.headers.get(
            "x-face-api-key",
            ""
        )

        if not hmac.compare_digest(recebida, FACE_API_KEY):
            return JSONResponse(
                status_code=401,
                content={
                    "detail":
                        "Face API não autorizada."
                }
            )

    return await call_next(
        request
    )


# =========================================================
# INSIGHTFACE
# =========================================================

face_analyzer = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)


face_analyzer.prepare(
    ctx_id=-1,
    det_size=(640, 640)
)


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================

async def upload_para_frame(imagem: UploadFile):
    conteudo = await imagem.read()

    erro_upload = validar_metadados_upload(
        imagem.content_type,
        len(conteudo),
    )

    if erro_upload:
        status_code, detail = erro_upload
        raise HTTPException(
            status_code=status_code,
            detail=detail,
        )

    frame = decodificar_imagem(conteudo)

    if frame is None:

        raise HTTPException(
            status_code=400,
            detail="Imagem inválida."
        )

    return frame
# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "steelcontrol-face-api",
        "modelo": "buffalo_l"
    }


# =========================================================
# ANALISAR POSIÇÃO DO ROSTO
# =========================================================

@app.post("/face/analyze")
async def analisar_rosto(
    imagem: UploadFile = File(...)
):

    frame = await upload_para_frame(
        imagem
    )


    altura, largura = frame.shape[:2]


    # -----------------------------------------------------
    # ILUMINAÇÃO
    # -----------------------------------------------------

    brilho = medir_brilho(frame)


    # -----------------------------------------------------
    # DETECTAR
    # -----------------------------------------------------

    rostos = face_analyzer.get(
        frame
    )


    # -----------------------------------------------------
    # NENHUM ROSTO
    # -----------------------------------------------------

    if len(rostos) == 0:

        return {

            "detectado": False,

            "pronto": False,

            "quantidadeRostos": 0,

            "orientacao":
                "Posicione seu rosto em frente à câmera.",

            "tipoOrientacao":
                "procurando"

        }


    # -----------------------------------------------------
    # MAIS DE UM ROSTO
    # -----------------------------------------------------

    if len(rostos) > 1:

        return {

            "detectado": True,

            "pronto": False,

            "multiplosRostos": True,

            "quantidadeRostos":
                len(rostos),

            "orientacao":
                "Apenas uma pessoa deve aparecer na câmera.",

            "tipoOrientacao":
                "erro"

        }


    rosto = rostos[0]


    x1, y1, x2, y2 = limitar_bbox(

        rosto.bbox,

        largura,

        altura

    )


    largura_rosto = (
        x2 - x1
    )


    altura_rosto = (
        y2 - y1
    )


    centro_rosto_x = (
        x1 + x2
    ) / 2


    centro_rosto_y = (
        y1 + y2
    ) / 2


    centro_x_normalizado = (
        centro_rosto_x /
        largura
    )


    centro_y_normalizado = (
        centro_rosto_y /
        altura
    )


    proporcao_rosto = (
        largura_rosto /
        largura
    )


    # =====================================================
    # ORIENTAÇÕES
    # =====================================================

    pronto = True

    orientacao = (
        "Rosto bem posicionado. "
        "Mantenha-se parado."
    )

    tipo = "sucesso"


    # -----------------------------------------------------
    # ILUMINAÇÃO
    # -----------------------------------------------------

    if brilho < 55:

        pronto = False

        orientacao = (
            "O ambiente está escuro. "
            "Melhore a iluminação."
        )

        tipo = "aviso"


    elif brilho > 225:

        pronto = False

        orientacao = (
            "Há muita luz no seu rosto. "
            "Reduza a iluminação."
        )

        tipo = "aviso"


    # -----------------------------------------------------
    # DISTÂNCIA
    # -----------------------------------------------------

    elif proporcao_rosto < 0.20:

        pronto = False

        orientacao = (
            "Aproxime um pouco o rosto da câmera."
        )

        tipo = "aviso"


    elif proporcao_rosto > 0.55:

        pronto = False

        orientacao = (
            "Afaste um pouco o rosto da câmera."
        )

        tipo = "aviso"


    # -----------------------------------------------------
    # POSIÇÃO HORIZONTAL
    #
    # O vídeo do navegador é espelhado.
    # -----------------------------------------------------

    elif centro_x_normalizado < 0.38:

        pronto = False

        orientacao = (
            "Mova um pouco o rosto "
            "para a esquerda da tela."
        )

        tipo = "aviso"


    elif centro_x_normalizado > 0.62:

        pronto = False

        orientacao = (
            "Mova um pouco o rosto "
            "para a direita da tela."
        )

        tipo = "aviso"


    # -----------------------------------------------------
    # POSIÇÃO VERTICAL
    # -----------------------------------------------------

    elif centro_y_normalizado < 0.34:

        pronto = False

        orientacao = (
            "Abaixe um pouco o rosto."
        )

        tipo = "aviso"


    elif centro_y_normalizado > 0.68:

        pronto = False

        orientacao = (
            "Levante um pouco o rosto."
        )

        tipo = "aviso"


    # -----------------------------------------------------
    # POSE
    # -----------------------------------------------------

    pose = getattr(
        rosto,
        "pose",
        None
    )

    pitch = None
    yaw = None
    roll = None

    if (
        pose is not None
        and len(pose) >= 3
    ):
        pitch = float(pose[0])
        yaw = float(pose[1])
        roll = float(pose[2])


    if (
        pronto
        and pitch is not None
        and yaw is not None
        and roll is not None
    ):


        if abs(yaw) > 18:

            pronto = False

            orientacao = (
                "Olhe diretamente para a câmera."
            )

            tipo = "aviso"


        elif abs(pitch) > 18:

            pronto = False

            orientacao = (
                "Mantenha a cabeça reta "
                "e olhe para frente."
            )

            tipo = "aviso"


        elif abs(roll) > 18:

            pronto = False

            orientacao = (
                "Não incline a cabeça."
            )

            tipo = "aviso"


    # =====================================================
    # RESPOSTA
    # =====================================================

    return {

        "detectado":
            True,

        "pronto":
            pronto,

        "quantidadeRostos":
            1,

        "confianca":
            float(rosto.det_score),

        "orientacao":
            orientacao,

        "tipoOrientacao":
            tipo,

        "brilho":
            brilho,

        "pose": {
            "pitch": pitch,
            "yaw": yaw,
            "roll": roll
        },

        "bbox": {

            "x1": int(x1),

            "y1": int(y1),

            "x2": int(x2),

            "y2": int(y2)

        },

        "larguraImagem":
            largura,

        "alturaImagem":
            altura

    }


# =========================================================
# GERAR EMBEDDING
# =========================================================

@app.post("/face/embedding")
async def gerar_embedding(
    imagem: UploadFile = File(...)
):

    frame = await upload_para_frame(
        imagem
    )


    rostos = face_analyzer.get(
        frame
    )


    if len(rostos) == 0:

        raise HTTPException(

            status_code=404,

            detail=(
                "Nenhum rosto detectado."
            )

        )


    if len(rostos) > 1:

        raise HTTPException(

            status_code=400,

            detail=(
                "Apenas uma pessoa "
                "deve aparecer."
            )

        )


    rosto = rostos[0]


    if rosto.det_score < 0.70:

        raise HTTPException(

            status_code=400,

            detail=(
                "Qualidade facial insuficiente."
            )

        )


    embedding = (
        rosto
        .normed_embedding
        .astype(float)
        .tolist()
    )

    if not embedding_valido(embedding):
        raise HTTPException(
            status_code=500,
            detail="O modelo facial retornou um embedding inválido.",
        )


    return {

        "detectado":
            True,

        "confianca":
            float(rosto.det_score),

        "embedding":
            embedding,

        "tamanhoEmbedding":
            len(embedding)

    }


# =========================================================
# COMPATIBILIDADE COM O TESTE ANTIGO
# =========================================================

@app.post("/face/detect")
async def detectar_rosto(
    imagem: UploadFile = File(...)
):

    return await analisar_rosto(
        imagem
    )
