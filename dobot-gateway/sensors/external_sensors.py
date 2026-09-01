"""Ponto de extensão para instrumentação externa do TCC.

Quando DS18B20/MPU6050/sensor de corrente estiverem ligados ao ESP32, prefira
enviar a telemetria pelo Device API. Este módulo existe para uma futura ponte
serial/local sem misturar sensores externos com a telemetria nativa do Dobot.
"""

class ExternalSensors:
    def read(self) -> dict:
        return {
            "temperature": None,
            "vibration": None,
            "current": None,
            "installed": False,
        }
