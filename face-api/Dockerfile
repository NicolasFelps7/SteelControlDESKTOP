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
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin steelcontrol \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-production.txt ./requirements-production.txt

RUN python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install -r requirements-production.txt

COPY --chown=steelcontrol:steelcontrol app ./app

USER steelcontrol

# Pré-baixa o modelo durante o build usando o mesmo usuário não-root
# que executará a API, evitando permissões incorretas no cache.
RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l')"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
