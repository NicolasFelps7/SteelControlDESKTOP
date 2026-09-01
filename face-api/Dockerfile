FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       g++ \
       libglib2.0-0 \
       libgl1 \
       libgomp1 \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-production.txt ./requirements-production.txt

RUN python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install -r requirements-production.txt

COPY app ./app

# Pré-baixa o modelo durante o build para evitar depender do download
# no primeiro login facial em produção.
RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l')"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
