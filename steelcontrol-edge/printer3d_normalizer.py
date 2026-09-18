from __future__ import annotations
from typing import Any


def _first(*values):
    for value in values:
        if value is not None and value != "":
            return value
    return None


def _number(value):
    try:
        return float(value) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


def _pct(value):
    n = _number(value)
    if n is None:
        return None
    if 0 <= n <= 1:
        n *= 100
    return max(0.0, min(100.0, n))


def _map(value):
    return value if isinstance(value, dict) else {}


def _clean_map(value: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in value.items() if v is not None and v != ""}


def normalize_printer3d_telemetry(payload: dict[str, Any] | None, *, protocol: str | None = None) -> dict[str, Any]:
    """Converte telemetria de impressoras 3D para a IHM dedicada do SteelControl.

    O contrato é propositalmente independente de fabricante. Bridges de Klipper /
    Moonraker, OctoPrint, Marlin/RepRap, PrusaLink, Bambu e controladores
    proprietários podem alimentar apenas os sinais que possuírem. A IHM deixa os
    demais como ausentes em vez de fabricar leituras.
    """
    raw = dict(payload or {})
    extras = _map(raw.get("dadosExtras"))
    existing = _map(extras.get("impressora3d"))
    src = existing or _map(raw.get("impressora3d")) or _map(raw.get("printer3d")) or _map(raw.get("printer")) or raw

    temperatures = _map(src.get("temperatures"))
    job = _map(src.get("job")) or _map(src.get("print"))
    layer = _map(src.get("layer")) or _map(job.get("layer"))
    nozzle = _map(src.get("nozzle")) or _map(src.get("extruder"))
    bed = _map(src.get("bed")) or _map(src.get("buildPlate"))
    chamber = _map(src.get("chamber")) or (_map(src.get("resin")) if isinstance(src.get("resin"), dict) else {})
    process_temp = _map(src.get("processTemperature")) or _map(src.get("processTemp"))
    motion = _map(src.get("motion")) or _map(src.get("position")) or _map(src.get("axes"))
    position = _map(motion.get("position")) or _map(motion.get("axes")) or motion
    process = _map(src.get("process")) or _map(src.get("parameters"))
    material_info = _map(src.get("materialInfo")) or _map(src.get("materialData"))
    safety = _map(src.get("safety")) or _map(src.get("interlocks"))
    network = _map(src.get("network")) or _map(src.get("connection"))
    machine_info = _map(src.get("machine")) or _map(src.get("device"))
    camera = _map(src.get("camera")) or _map(src.get("webcam")) or _map(src.get("video"))
    capabilities = _map(src.get("capabilities")) or _map(src.get("features"))

    normalized: dict[str, Any] = {
        "schema": "steelcontrol-printer3d-hmi-v2",
        "technology": _first(src.get("technology"), src.get("tecnologia"), src.get("type")),
        "ecosystem": _first(src.get("ecosystem"), src.get("ecossistema"), src.get("platform"), protocol),
        "state": _first(src.get("state"), src.get("status"), job.get("state"), job.get("status")),
        "filename": _first(src.get("filename"), src.get("file"), job.get("filename"), job.get("file")),
        "progress": _pct(_first(src.get("progress"), job.get("progress"), raw.get("progress"))),
        "nozzle": _clean_map({
            "current": _number(_first(nozzle.get("current"), nozzle.get("actual"), nozzle.get("temperature"), temperatures.get("nozzle"), temperatures.get("tool0"), src.get("nozzleTemp"), src.get("hotendTemp"))),
            "target": _number(_first(nozzle.get("target"), nozzle.get("setpoint"), src.get("nozzleTarget"), src.get("hotendTarget"))),
            "power": _pct(_first(nozzle.get("power"), nozzle.get("powerPercent"))),
        }),
        "bed": _clean_map({
            "current": _number(_first(bed.get("current"), bed.get("actual"), bed.get("temperature"), temperatures.get("bed"), src.get("bedTemp"), src.get("buildPlateTemp"))),
            "target": _number(_first(bed.get("target"), bed.get("setpoint"), src.get("bedTarget"), src.get("buildPlateTarget"))),
            "power": _pct(_first(bed.get("power"), bed.get("powerPercent"))),
        }),
        "chamber": _clean_map({
            "current": _number(_first(chamber.get("current"), chamber.get("actual"), chamber.get("temperature"), temperatures.get("chamber"), temperatures.get("resin"), src.get("chamberTemp"), src.get("ambientTemp"))),
            "target": _number(_first(chamber.get("target"), chamber.get("setpoint"), src.get("chamberTarget"))),
        }),
        "processTemperature": _clean_map({
            "current": _number(_first(process_temp.get("current"), process_temp.get("actual"), process_temp.get("temperature"), temperatures.get("process"), temperatures.get("powder"), src.get("resinTemperature"), src.get("powderTemperature"))),
            "target": _number(_first(process_temp.get("target"), process_temp.get("setpoint"), src.get("resinTarget"), src.get("powderTarget"))),
        }),
        "layer": _clean_map({
            "current": _first(layer.get("current"), layer.get("number"), src.get("currentLayer"), src.get("layerCurrent")),
            "total": _first(layer.get("total"), src.get("totalLayers"), src.get("layerTotal")),
        }),
        "elapsedSeconds": _number(_first(src.get("elapsedSeconds"), src.get("elapsed"), job.get("elapsedSeconds"), job.get("elapsed"))),
        "remainingSeconds": _number(_first(src.get("remainingSeconds"), src.get("remaining"), job.get("remainingSeconds"), job.get("remaining"))),
        "speedPercent": _pct(_first(src.get("speedPercent"), src.get("speed"), job.get("speedPercent"), process.get("speedPercent"))),
        "fanPercent": _pct(_first(src.get("fanPercent"), src.get("fan"), job.get("fanPercent"), process.get("fanPercent"))),
        "flowPercent": _pct(_first(src.get("flowPercent"), src.get("flow"), process.get("flowPercent"))),
        "liftSpeed": _number(_first(src.get("liftSpeed"), process.get("liftSpeed"))),
        "powderFeedPercent": _pct(_first(src.get("powderFeedPercent"), src.get("powderFeed"), process.get("powderFeedPercent"))),
        "powerPercent": _pct(_first(src.get("powerPercent"), src.get("power"), process.get("powerPercent"))),
        "uvPowerPercent": _pct(_first(src.get("uvPowerPercent"), src.get("uvPower"), process.get("uvPowerPercent"))),
        "laserPowerPercent": _pct(_first(src.get("laserPowerPercent"), src.get("laserPower"), process.get("laserPowerPercent"))),
        "exposureSeconds": _number(_first(src.get("exposureSeconds"), src.get("exposureTime"), process.get("exposureSeconds"), process.get("exposureTime"))),
        "material": _first(src.get("material") if isinstance(src.get("material"), str) else None, src.get("filament"), src.get("resin") if isinstance(src.get("resin"), str) else None, job.get("material"), material_info.get("type"), material_info.get("name")),
        "materialUsed": _first(src.get("materialUsed"), src.get("filamentUsed"), src.get("resinUsed"), job.get("materialUsed"), material_info.get("used")),
        "materialRemaining": _first(src.get("materialRemaining"), src.get("filamentRemaining"), src.get("resinRemaining"), material_info.get("remaining"), material_info.get("remainingPercent")),
        "position": _clean_map({
            "x": _number(_first(position.get("x"), src.get("x"), src.get("axisX"))),
            "y": _number(_first(position.get("y"), src.get("y"), src.get("axisY"))),
            "z": _number(_first(position.get("z"), src.get("z"), src.get("axisZ"))),
            "e": _number(_first(position.get("e"), position.get("extruder"), src.get("e"), src.get("axisE"))),
        }),
        "firmware": _first(src.get("firmware"), machine_info.get("firmware"), src.get("firmwareVersion"), machine_info.get("version")),
        "host": _first(src.get("host"), src.get("hostname"), src.get("ip"), network.get("host"), network.get("ip")),
        "alarm": _first(src.get("alarm"), src.get("error"), src.get("message"), safety.get("alarm"), safety.get("error")),
        "safety": _clean_map({
            "door": _first(src.get("door"), src.get("doorOpen"), safety.get("door"), safety.get("doorOpen")),
            "interlock": _first(src.get("interlock"), safety.get("interlock"), safety.get("ok")),
            "emergency": _first(src.get("emergency"), src.get("emergencyStop"), safety.get("emergency"), safety.get("emergencyStop")),
        }),
        "camera": _clean_map({
            "streamUrl": _first(camera.get("streamUrl"), camera.get("stream"), camera.get("mjpeg"), src.get("cameraStreamUrl"), src.get("streamUrl")),
            "snapshotUrl": _first(camera.get("snapshotUrl"), camera.get("snapshot"), camera.get("imageUrl"), src.get("cameraSnapshotUrl"), src.get("snapshotUrl")),
            "name": _first(camera.get("name"), camera.get("label"), "Câmera da impressora"),
            "online": _first(camera.get("online"), camera.get("connected"), src.get("cameraOnline")),
        }),
        "capabilities": _clean_map({
            "pause": _first(capabilities.get("pause"), capabilities.get("canPause"), src.get("canPause")),
            "resume": _first(capabilities.get("resume"), capabilities.get("canResume"), src.get("canResume")),
            "cancel": _first(capabilities.get("cancel"), capabilities.get("canCancel"), src.get("canCancel")),
            "home": _first(capabilities.get("home"), capabilities.get("canHome"), src.get("canHome")),
            "light": _first(capabilities.get("light"), capabilities.get("hasLight"), src.get("hasLight")),
            "camera": _first(capabilities.get("camera"), capabilities.get("hasCamera"), src.get("hasCamera")),
        }),
        "timestamp": _first(src.get("timestamp"), src.get("updatedAt"), src.get("lastUpdate")),
        "source": _first(src.get("source"), src.get("origin"), raw.get("origem"), protocol),
    }

    # Mantém estruturas úteis para a IHM, removendo apenas campos realmente vazios.
    for key in list(normalized):
        value = normalized[key]
        if value is None or value == "" or value == {}:
            normalized.pop(key)

    extras = dict(extras)
    extras["impressora3d"] = normalized
    raw["dadosExtras"] = extras
    raw.setdefault("origem", "IMPRESSORA_3D")

    # O campo industrial geral é limitado pelo backend e não deve receber a
    # temperatura do hotend, que pode ultrapassar 250 °C. Preferimos ambiente /
    # câmara; na ausência, mantemos o comportamento compatível do gateway.
    if raw.get("temperatura") is None:
        raw["temperatura"] = _first(_map(normalized.get("chamber")).get("current"), src.get("ambientTemp"), 35.0)
    return raw
