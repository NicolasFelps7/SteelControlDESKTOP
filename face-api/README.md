# SteelControl Face API

Serviço Python/FastAPI responsável por análise facial e geração de embeddings com InsightFace.

## Papel na arquitetura

Fluxo de autenticação facial:

```text
Frontend -> Backend Node.js -> Face API Python -> Backend Node.js
```

O navegador não envia um embedding como fonte confiável para autenticação. No login, o Node recebe as imagens, consulta este serviço e realiza a comparação com os registros do PostgreSQL.

O frontend pode consultar `/face/analyze` apenas para orientar posicionamento/iluminação durante a captura; essa resposta não autentica ninguém.

## Instalação

```powershell
cd face-api
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Executar localmente

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

No Windows, o `insightface==0.7.3` precisa do Microsoft C++ Build Tools. No
Visual Studio Installer, selecione **Desenvolvimento para desktop com C++**,
incluindo MSVC x64/x86 e o Windows SDK. O inicializador da raiz verifica esse
pré-requisito antes de tentar instalar as dependências.

Por segurança, para a demonstração local mantenha o serviço ligado apenas em `127.0.0.1`. Expor em `0.0.0.0` deve ser feito somente quando houver uma necessidade de rede e controles adicionais.

## Health check

```text
GET http://127.0.0.1:8000/health
```

## Observação de segurança

A prova de vida por movimento de cabeça é adequada para demonstração de TCC, mas não substitui anti-spoofing certificado em produção.

## Ambiente congelado para a banca

As versões usadas pelo TCC estão fixadas em `requirements.txt` e `requirements-lock.txt`.
Depois de instalar, valide com:

```powershell
py verificar_ambiente.py
```

O reconhecimento facial usa o modelo `buffalo_l`. Deixe esse modelo baixado no computador **antes** da apresentação; não dependa de internet no dia da banca.
