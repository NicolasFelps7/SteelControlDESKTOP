# SteelControl — descoberta automática resiliente

## Objetivo

O SteelControl localiza dispositivos compatíveis na rede local, reduz o cadastro manual e agora possui três camadas de recuperação quando a descoberta automática não funciona:

1. anúncio espontâneo do equipamento via UDP;
2. botão **Procurar novamente**, que envia a solicitação para o broadcast global e para os broadcasts das interfaces IPv4 privadas detectadas;
3. **Fallback por IP**, no qual o administrador informa apenas o IPv4/porta e o backend consulta a identidade SteelControl do equipamento.

Desktop e Mobile usam o mesmo backend e, portanto, enxergam exatamente os mesmos dispositivos e o mesmo diagnóstico.

## Fluxo normal por UDP

1. O dispositivo anuncia `steelcontrol-device` via UDP na porta `4210`.
2. O backend registra o anúncio apenas quando o endereço de origem é IPv4 privado/local.
3. Desktop e Mobile exibem o equipamento em **Descoberta automática**.
4. Somente um **ADMINISTRADOR** pode aprovar.
5. O backend cria a máquina como **Equipamento real**, gera uma Device Key exclusiva e mantém o controle remoto desativado.
6. Se o dispositivo expuser `/steelcontrol/provision`, o backend entrega `machineId`, `deviceKey` e `apiBaseUrl` diretamente ao dispositivo na LAN.
7. O dispositivo salva as credenciais e inicia telemetria/ACK normalmente.

## Procurar novamente

O botão **Procurar novamente** chama `POST /descoberta/varrer`.

O backend tenta enviar o pacote de descoberta para:

- `255.255.255.255`;
- o broadcast calculado de cada interface IPv4 privada ativa do computador/servidor.

Isso ajuda quando Windows, Docker, VPN ou mais de um adaptador de rede fazem a busca sair pela interface errada.

## Fallback por IP

Quando broadcast UDP é bloqueado, o administrador pode informar um IPv4 local, por exemplo:

```text
192.168.0.87
```

O backend consulta somente:

```text
GET http://192.168.0.87:80/steelcontrol/discovery
```

O endpoint precisa responder uma identidade `steelcontrol-device` válida. Se a identidade for aceita, o dispositivo entra na mesma lista de aprovação da descoberta UDP.

O fallback:

- aceita somente IPv4 privado/local;
- não aceita URL arbitrária nem hostname;
- usa um caminho fixo `/steelcontrol/discovery`;
- bloqueia redirects;
- possui timeout curto;
- não envia Device Key durante a detecção;
- não cadastra a máquina sem aprovação do administrador;
- não habilita START.

O exemplo ESP32 incluído já expõe esse endpoint.

## Diagnóstico da descoberta

`GET /descoberta/diagnostico` informa ao Desktop e Mobile:

- se a descoberta está habilitada;
- se o listener UDP está pronto;
- porta UDP utilizada;
- interfaces IPv4 privadas encontradas;
- broadcasts usados na última busca;
- quantidade de dispositivos atualmente visíveis;
- horário da última resposta SteelControl válida;
- erros de envio UDP;
- resultado da última tentativa pelo IP;
- possíveis causas quando nenhum dispositivo responde.

As causas são hipóteses de diagnóstico, não uma afirmação absoluta. Exemplos:

- firewall bloqueando UDP/4210;
- isolamento de clientes no Wi-Fi/AP isolation;
- dispositivo e backend em VLANs/sub-redes diferentes;
- VPN/Docker/adaptador virtual interferindo na rota;
- firmware sem o protocolo de descoberta SteelControl.

## Segurança

A descoberta não autoriza START e não substitui segurança industrial. O provisionamento automático:

- aceita somente anúncios vindos de endereços IPv4 privados/locais;
- não confia no `host` informado pelo payload UDP: usa o IP de origem do pacote;
- limita o endpoint de provisionamento ao mesmo host descoberto;
- bloqueia redirects no provisionamento;
- usa um `pairingNonce` efêmero no exemplo ESP32;
- exige aprovação administrativa antes de criar a máquina;
- impede que o mesmo `discoveryId` seja reivindicado duas vezes;
- deixa `integracaoMeta.hmi.remoteControlEnabled=false` por padrão;
- preserva Device Key, ACK, TTL dos comandos, telemetria fresca e intertravamentos da IHM.

Para ambiente industrial real, use segmentação de rede/VLAN, gateway industrial e TLS quando o controlador suportar. E-stop, relé de segurança, Safety PLC e proteções físicas continuam externos ao SteelControl.

## Configuração do backend

Variáveis opcionais:

```env
DISCOVERY_ENABLED=true
DISCOVERY_PORT=4210
DISCOVERY_ADVERTISE_URL=""
```

`DISCOVERY_ADVERTISE_URL` só é necessária quando o backend não consegue descobrir automaticamente qual IP LAN o dispositivo deve usar, por exemplo em algumas topologias Docker/VPN.

Exemplo:

```env
DISCOVERY_ADVERTISE_URL="http://192.168.0.100:3000"
```

## ESP32

Use `device-examples/ESP32_HTTP_STEELCONTROL.ino`.

No firmware, normalmente você só precisa preencher Wi-Fi:

```cpp
const char* WIFI_SSID = "SUA_REDE";
const char* WIFI_PASSWORD = "SUA_SENHA";
```

Deixe `DEFAULT_API_HOST`, `DEFAULT_MACHINE_ID` e `DEFAULT_DEVICE_KEY` vazios/zero para usar provisionamento automático.

O firmware 2.1 possui:

- anúncio UDP/4210;
- resposta ao comando de descoberta;
- endpoint `GET /steelcontrol/discovery` para fallback por IP;
- endpoint `POST /steelcontrol/provision` para provisionamento aprovado;
- telemetria;
- fila de comandos e ACK da IHM.

O `HMI_REMOTE_START_ARMED` continua `false`. Para teste de bancada com LED ele pode ser alterado depois de validar os intertravamentos, mas não deve ser usado para contornar circuitos físicos de segurança.

## Desktop e Mobile

Na tela de Máquinas, administradores veem:

- **Procurar novamente**;
- fallback **Detectar pelo IP**;
- diagnóstico de UDP/interfaces/rede;
- IP/controlador/protocolo detectados;
- origem da detecção (`UDP` ou `IP`);
- estado de reivindicação;
- **Adicionar ao SteelControl**.

Depois da aprovação, a máquina aparece na lista normal e abre seu dashboard/IHM conforme o controlador.

## Compatibilidade

A descoberta é automática para dispositivos/gateways que implementem o protocolo SteelControl. Uma máquina industrial legada que só fale Modbus TCP, OPC UA ou outro protocolo não passa a ser detectável automaticamente sem um adaptador. Nesse caso, um **SteelControl Gateway** ou integração do fabricante deve anunciar a máquina ao SteelControl e traduzir o protocolo.
