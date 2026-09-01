from pathlib import Path
import importlib.metadata as metadata
import sys

REQUERIDAS = {
    "fastapi": "0.116.1",
    "uvicorn": "0.35.0",
    "python-multipart": "0.0.20",
    "numpy": "2.2.6",
    "opencv-python": "4.12.0.88",
    "insightface": "0.7.3",
    "onnxruntime": "1.22.1",
}

strict = "--strict" in sys.argv
falhas = []

for pacote, esperado in REQUERIDAS.items():
    try:
        atual = metadata.version(pacote)
    except metadata.PackageNotFoundError:
        falhas.append(f"{pacote}: não instalado")
        continue

    if atual != esperado:
        falhas.append(f"{pacote}: {atual} (esperado {esperado})")

if falhas:
    print("AMBIENTE FACE API: ERRO")
    for item in falhas:
        print(" -", item)
    raise SystemExit(1)

modelo = Path.home() / ".insightface" / "models" / "buffalo_l"
if not modelo.exists():
    print("AMBIENTE FACE API: DEPENDÊNCIAS OK")
    print("ATENÇÃO: modelo buffalo_l ainda não está em ~/.insightface/models/buffalo_l.")
    print("Inicie a Face API uma vez com internet antes da banca; depois rode este verificador novamente.")
    if strict:
        raise SystemExit(2)
    raise SystemExit(0)

print("AMBIENTE FACE API: OK")
print("Dependências congeladas e modelo buffalo_l disponível para uso offline.")
