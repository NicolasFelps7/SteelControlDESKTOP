/*
  SteelControl - ESP32 HTTP/REST + descoberta/provisionamento automático + IHM

  FLUXO AUTOMÁTICO:
  1) ESP32 entra no Wi-Fi e anuncia sua presença por UDP/4210.
  2) SteelControl exibe "Equipamento encontrado" no Desktop e Mobile.
  3) Administrador aprova.
  4) Backend entrega MACHINE_ID + DEVICE_KEY + API_HOST ao ESP32 via LAN.
  5) ESP32 salva as credenciais em NVS (Preferences) e começa a telemetria.

  SEGURANÇA:
  - Descoberta NÃO habilita controle remoto.
  - START remoto nasce BLOQUEADO: HMI_REMOTE_START_ARMED=false.
  - Provisionamento exige nonce efêmero recebido no anúncio UDP.
  - IHM_STOP é parada OPERACIONAL, não E-STOP.
  - Nenhum comando substitui E-stop, relé de segurança, Safety PLC,
    cortina de luz ou circuito de potência certificado.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WiFiUdp.h>
#include <WebServer.h>

const char* WIFI_SSID = "SUA_REDE";
const char* WIFI_PASSWORD = "SUA_SENHA";

// Opcional: preencha para configuração manual. Deixe vazio/0 para usar descoberta automática.
const char* DEFAULT_API_HOST = "";
const int DEFAULT_MACHINE_ID = 0;
const char* DEFAULT_DEVICE_KEY = "";

const uint16_t DISCOVERY_PORT = 4210;
const uint16_t PROVISION_PORT = 80;
const char* FIRMWARE_VERSION = "steelcontrol-esp32-2.1";

// Ative SOMENTE depois de implementar e testar os intertravamentos físicos.
const bool HMI_REMOTE_START_ARMED = false;

Preferences prefs;
WiFiUDP discoveryUdp;
WebServer provisionServer(PROVISION_PORT);

String apiHost;
int machineId = 0;
String deviceKey;
String pairingNonce;
String deviceIdentifier;

unsigned long ultimoEnvio = 0;
unsigned long ultimoComando = 0;
unsigned long ultimoAnuncio = 0;
unsigned long ciclos = 0;
bool hmiRunning = false;
bool hmiAlarm = false;
String hmiMode = "AUTO";

float lerTemperatura() { return 35.0; }
float lerVibracao() { return hmiRunning ? 1.2 : 0.2; }
float lerCorrente() { return hmiRunning ? 0.8 : 0.05; }
float lerCargaEletricaPercentual() { return hmiRunning ? 55.0 : 8.0; }

// Substitua por leituras reais (GPIO, relé de segurança, Safety PLC etc.).
bool lerEStopOk() { return true; }
bool lerPortaSegurancaFechada() { return true; }
bool lerProtecaoOk() { return true; }
bool lerSensorEntrada() { return false; }
bool lerSensorMeio() { return false; }
bool lerSensorSaida() { return false; }

bool startPermitido() {
  return HMI_REMOTE_START_ARMED &&
         lerEStopOk() &&
         lerPortaSegurancaFechada() &&
         lerProtecaoOk() &&
         !hmiAlarm;
}

String criarDeviceIdentifier() {
  const uint64_t chip = ESP.getEfuseMac();
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "ESP32-%04X%08X",
           (uint16_t)(chip >> 32), (uint32_t)chip);
  return String(buffer);
}

String criarNonce() {
  char buffer[40];
  snprintf(buffer, sizeof(buffer), "%08lX-%08lX-%08lX",
           (unsigned long)esp_random(),
           (unsigned long)esp_random(),
           (unsigned long)millis());
  return String(buffer);
}

bool provisionado() {
  return machineId > 0 && apiHost.length() >= 8 && deviceKey.length() >= 20;
}

void carregarConfiguracao() {
  apiHost = prefs.getString("apiHost", DEFAULT_API_HOST);
  machineId = prefs.getInt("machineId", DEFAULT_MACHINE_ID);
  deviceKey = prefs.getString("deviceKey", DEFAULT_DEVICE_KEY);
}

void salvarConfiguracao(const String& host, int id, const String& key) {
  prefs.putString("apiHost", host);
  prefs.putInt("machineId", id);
  prefs.putString("deviceKey", key);
  apiHost = host;
  machineId = id;
  deviceKey = key;
}

void paradaOperacional() {
  hmiRunning = false;
  Serial.println("IHM STOP - PARADA OPERACIONAL");
}

void pararAtuadoresSeguranca() {
  hmiRunning = false;
  hmiAlarm = true;
  Serial.println("PARADA LOGICA DE SEGURANCA RECEBIDA");
}

void liberarAtuadoresSeguranca() {
  hmiAlarm = false;
  Serial.println("OPERACAO DE SEGURANCA LIBERADA PELO STEELCONTROL");
}

bool iniciarOperacao() {
  if (!startPermitido()) {
    Serial.println("IHM START BLOQUEADO PELOS INTERTRAVAMENTOS");
    return false;
  }
  hmiRunning = true;
  Serial.println("IHM START - OPERACAO INICIADA");
  return true;
}

void resetOperacional() { Serial.println("IHM RESET"); }
void ackAlarmes() { Serial.println("IHM ACK"); }

bool enviarJson(const String& url, const String& body) {
  if (!provisionado()) return false;
  HTTPClient http;
  http.setTimeout(3500);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", deviceKey.c_str());
  const int code = http.POST(body);
  const String resposta = http.getString();
  http.end();
  Serial.printf("POST %s -> %d\n", url.c_str(), code);
  if (resposta.length()) Serial.println(resposta);
  return code >= 200 && code < 300;
}

void enviarAnuncioDescoberta() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<768> doc;
  doc["service"] = "steelcontrol-device";
  doc["version"] = 1;
  doc["id"] = deviceIdentifier;
  doc["name"] = "ESP32 SteelControl";
  doc["manufacturer"] = "Espressif";
  doc["model"] = "ESP32";
  doc["serial"] = deviceIdentifier;
  doc["firmware"] = FIRMWARE_VERSION;
  doc["controller"] = "ESP32";
  doc["protocol"] = "HTTP_REST";
  doc["port"] = PROVISION_PORT;
  doc["provisionPath"] = "/steelcontrol/provision";
  doc["pairingNonce"] = pairingNonce;
  JsonArray capabilities = doc.createNestedArray("capabilities");
  capabilities.add("telemetry");
  capabilities.add("hmi");
  capabilities.add("command-ack");
  capabilities.add("auto-provision");
  capabilities.add("ip-fallback");

  String packet;
  serializeJson(doc, packet);
  discoveryUdp.beginPacket(IPAddress(255, 255, 255, 255), DISCOVERY_PORT);
  discoveryUdp.write((const uint8_t*)packet.c_str(), packet.length());
  discoveryUdp.endPacket();
}

void responderDescoberta() {
  const int packetSize = discoveryUdp.parsePacket();
  if (packetSize <= 0 || packetSize > 1024) return;
  char buffer[1025];
  const int read = discoveryUdp.read(buffer, sizeof(buffer) - 1);
  if (read <= 0) return;
  buffer[read] = '\0';
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, buffer)) return;
  if (String(doc["service"] | "") == "steelcontrol-discovery" &&
      String(doc["action"] | "") == "discover") {
    enviarAnuncioDescoberta();
  }
}

void configurarProvisionamento() {
  provisionServer.on("/steelcontrol/provision", HTTP_POST, []() {
    if (!provisionServer.hasArg("plain")) {
      provisionServer.send(400, "application/json", "{\"mensagem\":\"JSON ausente.\"}");
      return;
    }

    StaticJsonDocument<768> doc;
    if (deserializeJson(doc, provisionServer.arg("plain"))) {
      provisionServer.send(400, "application/json", "{\"mensagem\":\"JSON invalido.\"}");
      return;
    }

    const String nonce = String(doc["pairingNonce"] | "");
    const String host = String(doc["apiBaseUrl"] | "");
    const String key = String(doc["deviceKey"] | "");
    const int id = doc["machineId"] | 0;

    if (nonce != pairingNonce) {
      provisionServer.send(403, "application/json", "{\"mensagem\":\"Nonce de pareamento invalido.\"}");
      return;
    }
    if (provisionado()) {
      provisionServer.send(409, "application/json", "{\"mensagem\":\"Dispositivo ja provisionado. Apague a NVS para parear novamente.\"}");
      return;
    }
    if (id <= 0 || key.length() < 20 || !(host.startsWith("http://") || host.startsWith("https://"))) {
      provisionServer.send(400, "application/json", "{\"mensagem\":\"Credenciais invalidas.\"}");
      return;
    }

    salvarConfiguracao(host, id, key);
    pairingNonce = criarNonce();
    provisionServer.send(200, "application/json", "{\"ok\":true,\"mensagem\":\"Provisionado com sucesso.\"}");
    Serial.printf("Provisionado automaticamente: machineId=%d api=%s\n", machineId, apiHost.c_str());
  });

  // Fallback quando broadcast UDP/mDNS for bloqueado pela rede.
  // O endpoint expõe SOMENTE a identidade de descoberta; nunca retorna Device Key.
  provisionServer.on("/steelcontrol/discovery", HTTP_GET, []() {
    StaticJsonDocument<768> doc;
    doc["service"] = "steelcontrol-device";
    doc["version"] = 1;
    doc["id"] = deviceIdentifier;
    doc["name"] = "ESP32 SteelControl";
    doc["manufacturer"] = "Espressif";
    doc["model"] = "ESP32";
    doc["serial"] = deviceIdentifier;
    doc["firmware"] = FIRMWARE_VERSION;
    doc["controller"] = "ESP32";
    doc["protocol"] = "HTTP_REST";
    doc["port"] = PROVISION_PORT;
    doc["provisionPath"] = "/steelcontrol/provision";
    doc["pairingNonce"] = pairingNonce;
    JsonArray capabilities = doc.createNestedArray("capabilities");
    capabilities.add("telemetry");
    capabilities.add("hmi");
    capabilities.add("command-ack");
    capabilities.add("auto-provision");
    capabilities.add("ip-fallback");

    String body;
    serializeJson(doc, body);
    provisionServer.sendHeader("Cache-Control", "no-store");
    provisionServer.send(200, "application/json", body);
  });

  provisionServer.onNotFound([]() {
    provisionServer.send(404, "application/json", "{\"mensagem\":\"Rota nao encontrada.\"}");
  });
  provisionServer.begin();
}

void enviarTelemetria() {
  if (!provisionado()) return;
  StaticJsonDocument<768> doc;
  doc["temperatura"] = lerTemperatura();
  doc["vibracao"] = lerVibracao();
  doc["corrente"] = lerCorrente();
  doc["consumoEnergia"] = constrain(lerCargaEletricaPercentual(), 0.0f, 100.0f);
  doc["producao"] = ciclos;
  doc["ciclos"] = ciclos;
  doc["qualidadeSinal"] = constrain(map(WiFi.RSSI(), -100, -40, 0, 100), 0, 100);
  doc["origem"] = "ESP32";

  JsonObject hmi = doc.createNestedObject("dadosExtras").createNestedObject("hmi");
  hmi["running"] = hmiRunning;
  hmi["mode"] = hmiMode;
  hmi["alarm"] = hmiAlarm;
  JsonObject interlocks = hmi.createNestedObject("interlocks");
  interlocks["startPermitted"] = startPermitido();
  interlocks["estopOk"] = lerEStopOk();
  interlocks["safetyDoorClosed"] = lerPortaSegurancaFechada();
  interlocks["guardOk"] = lerProtecaoOk();
  JsonObject sensors = hmi.createNestedObject("sensors");
  sensors["entry"] = lerSensorEntrada();
  sensors["middle"] = lerSensorMeio();
  sensors["exit"] = lerSensorSaida();

  String body;
  serializeJson(doc, body);
  enviarJson(apiHost + "/device/" + machineId + "/telemetria", body);
  if (hmiRunning) ciclos++;
}

bool confirmarComando(int comandoId, const char* status) {
  StaticJsonDocument<96> doc;
  doc["status"] = status;
  String body;
  serializeJson(doc, body);
  return enviarJson(apiHost + "/device/" + machineId + "/comandos/" + comandoId + "/confirmar", body);
}

bool executarComando(const String& comando) {
  if (comando == "PARAR_SEGURANCA") { pararAtuadoresSeguranca(); return true; }
  if (comando == "LIBERAR_OPERACAO") { liberarAtuadoresSeguranca(); return true; }
  if (comando == "IHM_STOP") { paradaOperacional(); return true; }
  if (comando == "IHM_START") return iniciarOperacao();
  if (comando == "IHM_RESET") { if (hmiAlarm) return false; resetOperacional(); return true; }
  if (comando == "IHM_ACK") { ackAlarmes(); return true; }
  if (comando == "IHM_MODE_AUTO") { if (hmiRunning) return false; hmiMode = "AUTO"; return true; }
  if (comando == "IHM_MODE_MANUAL") { if (hmiRunning) return false; hmiMode = "MANUAL"; return true; }
  return false;
}

void consultarComandos() {
  if (!provisionado()) return;
  HTTPClient http;
  const String url = apiHost + "/device/" + machineId + "/comandos/proximo";
  http.setTimeout(3500);
  http.begin(url);
  http.addHeader("X-Device-Key", deviceKey.c_str());
  const int code = http.GET();
  if (code == 204) { http.end(); return; }

  if (code == 200) {
    StaticJsonDocument<512> doc;
    const String resposta = http.getString();
    if (!deserializeJson(doc, resposta)) {
      const int comandoId = doc["id"] | 0;
      const String comando = doc["comando"] | "";
      const int ultimoConcluido = prefs.getInt("lastCmd", 0);
      if (comandoId > 0 && comandoId == ultimoConcluido) {
        confirmarComando(comandoId, "CONCLUIDO");
      } else if (comandoId > 0) {
        const bool executado = executarComando(comando);
        const char* status = executado ? "CONCLUIDO" : "FALHOU";
        if (confirmarComando(comandoId, status) && executado) prefs.putInt("lastCmd", comandoId);
      }
    }
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  prefs.begin("steelcontrol", false);
  deviceIdentifier = criarDeviceIdentifier();
  pairingNonce = criarNonce();
  carregarConfiguracao();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("ESP32 conectado. IP: ");
  Serial.println(WiFi.localIP());

  discoveryUdp.begin(DISCOVERY_PORT);
  configurarProvisionamento();
  enviarAnuncioDescoberta();

  if (provisionado()) {
    Serial.printf("SteelControl configurado: machineId=%d api=%s\n", machineId, apiHost.c_str());
  } else {
    Serial.println("Aguardando descoberta/aprovacao automatica no SteelControl...");
  }
  Serial.println("IHM real: START remoto continua bloqueado ate HMI_REMOTE_START_ARMED=true e intertravamentos fisicos validados.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(800);
    return;
  }

  provisionServer.handleClient();
  responderDescoberta();

  if (millis() - ultimoAnuncio >= 3000) {
    ultimoAnuncio = millis();
    enviarAnuncioDescoberta();
  }
  if (millis() - ultimoEnvio >= 2000) {
    ultimoEnvio = millis();
    enviarTelemetria();
  }
  if (millis() - ultimoComando >= 1000) {
    ultimoComando = millis();
    consultarComandos();
  }
}
