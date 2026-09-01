/*
  SteelControl - ESP32 HTTP/REST (versão congelada para TCC)

  - Telemetria real por Device Key.
  - Comandos usam ACK e reentrega automática.
  - O último comando concluído é persistido em NVS (Preferences), evitando
    executar duas vezes o mesmo comando após retransmissão/reinício.
  - consumoEnergia = carga elétrica normalizada de 0 a 100%.

  IMPORTANTE: PARAR_SEGURANCA é uma parada lógica de demonstração e NÃO
  substitui botão de emergência, relé de segurança ou Safety PLC certificado.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

const char* WIFI_SSID = "SUA_REDE";
const char* WIFI_PASSWORD = "SUA_SENHA";
const char* API_HOST = "http://192.168.0.100:3000"; // IP do PC do SteelControl
const int MACHINE_ID = 1;
const char* DEVICE_KEY = "COLE_A_DEVICE_KEY";

unsigned long ultimoEnvio = 0;
unsigned long ultimoComando = 0;
unsigned long ciclos = 0;
Preferences prefs;

float lerTemperatura() { return 35.0; }
float lerVibracao() { return 1.2; }
float lerCorrente() { return 0.8; }
float lerCargaEletricaPercentual() { return 55.0; } // sempre 0..100%

void pararAtuadores() {
  Serial.println("PARADA LOGICA DE SEGURANCA RECEBIDA");
  // Bloqueie movimentos e leve o protótipo a um estado seguro.
}

void liberarAtuadores() {
  Serial.println("OPERACAO LIBERADA");
}

bool enviarJson(const String& url, const String& body) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  const int code = http.POST(body);
  const String resposta = http.getString();
  http.end();
  Serial.printf("POST %s -> %d\n", url.c_str(), code);
  if (resposta.length()) Serial.println(resposta);
  return code >= 200 && code < 300;
}

void enviarTelemetria() {
  StaticJsonDocument<384> doc;
  doc["temperatura"] = lerTemperatura();
  doc["vibracao"] = lerVibracao();
  doc["corrente"] = lerCorrente();
  doc["consumoEnergia"] = constrain(lerCargaEletricaPercentual(), 0.0f, 100.0f);
  doc["producao"] = ciclos;
  doc["ciclos"] = ciclos;
  doc["qualidadeSinal"] = constrain(map(WiFi.RSSI(), -100, -40, 0, 100), 0, 100);
  doc["origem"] = "ESP32";
  String body; serializeJson(doc, body);
  enviarJson(String(API_HOST) + "/device/" + MACHINE_ID + "/telemetria", body);
  ciclos++;
}

bool confirmarComando(int comandoId, const char* status) {
  StaticJsonDocument<96> doc;
  doc["status"] = status;
  String body; serializeJson(doc, body);
  return enviarJson(
    String(API_HOST) + "/device/" + MACHINE_ID + "/comandos/" + comandoId + "/confirmar",
    body
  );
}

void consultarComandos() {
  HTTPClient http;
  const String url = String(API_HOST) + "/device/" + MACHINE_ID + "/comandos/proximo";
  http.begin(url);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  const int code = http.GET();
  if (code == 204) { http.end(); return; }

  if (code == 200) {
    StaticJsonDocument<320> doc;
    const String resposta = http.getString();
    if (!deserializeJson(doc, resposta)) {
      const int comandoId = doc["id"] | 0;
      const String comando = doc["comando"] | "";
      const int ultimoConcluido = prefs.getInt("lastCmd", 0);

      if (comandoId > 0 && comandoId == ultimoConcluido) {
        // Reentrega do servidor: não executa novamente; apenas repete o ACK.
        confirmarComando(comandoId, "CONCLUIDO");
      } else if (comandoId > 0) {
        bool executado = false;
        if (comando == "PARAR_SEGURANCA") { pararAtuadores(); executado = true; }
        else if (comando == "LIBERAR_OPERACAO") { liberarAtuadores(); executado = true; }

        if (executado && confirmarComando(comandoId, "CONCLUIDO")) {
          prefs.putInt("lastCmd", comandoId);
        } else if (!executado) {
          confirmarComando(comandoId, "FALHOU");
        }
      }
    }
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  prefs.begin("steelcontrol", false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println(); Serial.print("ESP32 conectado. IP: "); Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); delay(1000); return; }
  if (millis() - ultimoEnvio >= 2000) { ultimoEnvio = millis(); enviarTelemetria(); }
  if (millis() - ultimoComando >= 1000) { ultimoComando = millis(); consultarComandos(); }
}
