# Painéis adaptativos por controlador

O dashboard seleciona recursos conforme o controlador cadastrado: ESP32, Dobot Magician, CLP/PLC, controlador robótico, CNC, gateway industrial ou genérico.

O contrato comum usa telemetria normalizada (`temperatura`, `vibracao`, `corrente`, `producao`, `ciclos`, `consumoEnergia`) e `dadosExtras` para campos específicos do fabricante.

A IHM industrial é habilitada para controladores compatíveis e o backend continua sendo a autoridade final de RBAC, intertravamentos, conexão e segurança.
