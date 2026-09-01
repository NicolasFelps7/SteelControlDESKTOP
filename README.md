# SteelControl — Gestão Industrial Inteligente

Projeto de TCC para monitoramento e gestão de máquinas industriais, com frontend HTML/CSS/JavaScript, API Node.js/Express, PostgreSQL/Prisma e serviço Python de reconhecimento facial.

## O que esta versão já entrega

- cadastro e gestão de máquinas;
- modo **Simulação** e **Equipamento real** separados;
- controladores/gateways: ESP32, CLP/PLC, CNC, controlador robótico e gateway industrial;
- protocolos cadastráveis: HTTP/REST, MQTT, Modbus TCP, OPC UA e TCP/IP;
- Device Key exclusiva por máquina;
- API de telemetria autenticada para dispositivos;
- temperatura, vibração, corrente, produção, ciclos e energia;
- limites de atenção/críticos configuráveis por máquina;
- estados **Conectada / Instável / Offline**;
- último sinal, qualidade e latência no diagnóstico;
- atualização em tempo real por SSE, com polling de segurança como fallback;
- parada de segurança automática em condição crítica;
- fila de comandos `PARAR_SEGURANCA` e `LIBERAR_OPERACAO` para equipamentos reais;
- histórico de alertas, logs, telemetria e auditoria;
- modo demonstração para banca;
- manutenção preventiva por ciclos;
- autenticação e reconhecimento facial.
- painéis adaptativos para ESP32, Dobot, CLP/PLC, controlador robótico, CNC,
  gateway industrial e equipamentos genéricos;

O cadastro sugere o protocolo e cria o painel compatível com o controlador.
Consulte `PAINEIS_ADAPTATIVOS_CONTROLADORES.md` para os campos de telemetria
específicos de cada integração.

## Arquitetura

```text
Sensores / Máquina / Robô
          |
          v
 ESP32 / CLP / Gateway
          |
          |  Device Key
          v
   API SteelControl
          |
    PostgreSQL / Prisma
          |
          +--> telemetria
          +--> alertas
          +--> comandos
          +--> auditoria
          |
          v
 Dashboard em tempo real
```

Para HTTP/REST a integração está pronta diretamente. Para Modbus, OPC UA, MQTT ou protocolos proprietários, o controlador/gateway deve ler o equipamento e enviar o JSON padrão do SteelControl. Isso permite integrar fabricantes diferentes sem reescrever o dashboard.

Leia `INTEGRACAO_MAQUINA_REAL.md` e `device-examples/ESP32_HTTP_STEELCONTROL.ino`.

## Requisitos

- Node.js 20+;
- PostgreSQL;
- Python 3.11 de 64 bits;
- Microsoft C++ Build Tools com a carga **Desenvolvimento para desktop com C++** (necessário para compilar o InsightFace no Windows);
- Navegador moderno. O frontend é servido pelo próprio backend.

## Iniciar

Crie `backend/.env` a partir de `.env.example`.

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Não use `prisma migrate reset` no seu banco atual.

Face API:

```powershell
cd face-api
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

No Windows, prefira executar `INICIAR_STEELCONTROL.ps1`: ele valida o Python,
detecta ambientes virtuais incompletos e reinstala as dependências quando o
`requirements.txt` mudar.

Abra `http://localhost:3000/app/login`. Não é necessário instalar ou iniciar
Live Server: frontend e API usam a mesma origem, como em produção.

Usuário seed:

- `admin@steelcontrol.com`
- `Steel123!`

## Integração de dispositivo

Ao cadastrar uma máquina, o SteelControl gera uma chave única. O dispositivo envia para:

```text
POST /device/:id/telemetria
X-Device-Key: <chave>
```

Exemplo:

```json
{
  "temperatura": 42.7,
  "vibracao": 1.6,
  "corrente": 0.82,
  "producao": 35,
  "ciclos": 128,
  "consumoEnergia": 61.4,
  "qualidadeSinal": 92,
  "latenciaMs": 18,
  "origem": "ESP32"
}
```

## Segurança

- JWT com segredo obrigatório;
- cargo/empresa/status do usuário revalidados no banco;
- rate limit;
- CORS allowlist;
- Device Key armazenada somente como SHA-256;
- credencial do dispositivo não é retornada pela API depois do cadastro;
- exclusão lógica de dados industriais;
- auditoria de ações administrativas e telemetria de dispositivo.

## Testes

```powershell
cd backend
npm test
```

A versão entregue foi revisada com checagem de sintaxe JavaScript e suíte de testes de regras de negócio/segurança.

## Observação importante

Nenhum software consegue conectar automaticamente em qualquer máquina industrial apenas escolhendo “Modbus” ou “OPC UA”, pois cada fabricante define endereços, registradores, nós e variáveis diferentes. O SteelControl está pronto do lado do sistema: você cadastra a máquina e usa um ESP32/CLP/gateway para converter os dados específicos do equipamento para o formato padrão da API.


## VERSÃO CONGELADA PARA TCC

As correções finais de estabilidade estão documentadas em `VERSAO_CONGELADA_TCC.md`. Rode `VALIDAR_PROJETO.ps1` antes da apresentação.


> **Unidade:** o campo `consumoEnergia` é mantido por compatibilidade, mas representa a **carga elétrica normalizada de 0 a 100%**.

---

## Hospedagem / Produção

A versão atual está preparada para hospedagem com frontend + API Node no mesmo serviço, PostgreSQL gerenciado e Face API Python separada. Consulte [`HOSPEDAGEM_PRONTA.md`](HOSPEDAGEM_PRONTA.md).

Validação rápida antes do deploy:

```bash
node tools/check-production.mjs
```


## Integração Dobot Magician
A versão profissional inclui `dobot-gateway/`, modo MOCK sem hardware e driver USB/Serial real. Consulte `INTEGRACAO_DOBOT_MAGICIAN.md`.

---

## Quality gate e entrega profissional

Esta versão possui hardening de engenharia sem alteração da lógica funcional.

Validação rápida:

```bash
npm run quality
```

No Windows:

```powershell
.\VALIDAR_PROJETO.ps1
```

Gate estrito antes de criar a tag final:

```powershell
.\VALIDAR_RELEASE.ps1
```

O GitHub Actions em `.github/workflows/quality-gate.yml` executa automaticamente validações estáticas, testes, segurança, Face API e E2E com PostgreSQL 16.

Documentação:

- `docs/HARDENING_ENGENHARIA.md`
- `docs/PROCESSO_DE_RELEASE.md`
- `docs/VALIDACAO_2026-09-01.md`
- `docs/CHECKLIST_SEGURANCA_RELEASE.md`

O arquivo `CODE_FREEZE.sha256` comprova a integridade dos arquivos funcionais congelados.

