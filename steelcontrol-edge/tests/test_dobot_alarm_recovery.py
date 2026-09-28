import importlib.util
import pathlib
import struct
import sys
import types
import unittest


EDGE_ROOT = pathlib.Path(__file__).resolve().parents[1]
adapters_package = types.ModuleType("adapters")
adapters_package.__path__ = [str(EDGE_ROOT / "adapters")]
sys.modules.setdefault("adapters", adapters_package)


def load_adapter_module(name):
    path = EDGE_ROOT / "adapters" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"adapters.{name}", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


load_adapter_module("base")
dobot_module = load_adapter_module("dobot_adapter")
AdapterError = dobot_module.AdapterError
DobotMagicianAdapter = dobot_module.DobotMagicianAdapter


class RecoveryProbe(DobotMagicianAdapter):
    def __init__(self, alarm_reads):
        super().__init__({})
        self.alarm_reads = list(alarm_reads)
        self.commands = []
        self.initialized = False
        self.queue_stopped = True

    def _exchange(self, cid, rw=0, queued=False, params=b""):
        self.commands.append(cid)
        return bytes([cid, 0])

    def _alarms(self):
        if len(self.alarm_reads) > 1:
            return self.alarm_reads.pop(0)
        return self.alarm_reads[0]

    def _initialize_controller(self):
        self.initialized = True


class ImmediateMotionProbe(DobotMagicianAdapter):
    def __init__(self):
        super().__init__({})
        self.commands = []
        self.pose_reads = 0

    def _exchange(self, cid, rw=0, queued=False, params=b""):
        self.commands.append((cid, rw, queued, params))
        return bytes([cid, 0])

    def _ensure_motion_ready(self):
        return None

    def _get_pose(self):
        self.pose_reads += 1
        if self.pose_reads == 1:
            return {"x": 150.0, "y": 150.0, "z": 100.0, "r": 0.0}
        return {"x": 155.0, "y": 150.0, "z": 100.0, "r": 0.0}


class DobotAlarmRecoveryTests(unittest.TestCase):
    def test_queue_index_reads_uint64(self):
        response = bytes([246, 0]) + struct.pack("<Q", 2**40 + 7)
        self.assertEqual(DobotMagicianAdapter._queue_index(response), 2**40 + 7)

    def test_ptp_uses_immediate_serial_command_and_confirms_pose(self):
        driver = ImmediateMotionProbe()

        driver.execute_command("DOBOT_PTP", {
            "x": 155, "y": 150, "z": 100, "r": 0, "velocidade": 20,
        })

        ptp = next(item for item in driver.commands if item[0] == 84)
        self.assertFalse(ptp[2])
        self.assertEqual(driver.production, 1)

    def test_home_uses_immediate_serial_command(self):
        driver = ImmediateMotionProbe()

        driver.execute_command("DOBOT_HOME")

        home = next(item for item in driver.commands if item[0] == 31)
        self.assertFalse(home[2])

    def test_alarm_zero_is_cleared_without_force_stop(self):
        driver = RecoveryProbe([[0], []])

        driver._recover_alarms()

        self.assertTrue(driver.initialized)
        self.assertFalse(driver.queue_stopped)
        self.assertNotIn(242, driver.commands)
        self.assertEqual(driver.commands[:3], [241, 245, 21])

    def test_persistent_startup_bit_is_acknowledged_only_after_clear(self):
        driver = RecoveryProbe([[0]])

        driver._recover_alarms()

        self.assertTrue(driver.initialized)
        self.assertTrue(driver.startup_reset_acknowledged)
        self.assertEqual(driver._blocking_alarms([0]), [])
        self.assertEqual(driver._blocking_alarms([0, 18]), [18])
        self.assertNotIn(242, driver.commands)

    def test_persistent_alarm_is_not_ignored(self):
        driver = RecoveryProbe([[18]])

        with self.assertRaises(AdapterError):
            driver._recover_alarms()

        self.assertFalse(driver.initialized)
        self.assertNotIn(242, driver.commands)
        self.assertNotIn(240, driver.commands)
        self.assertTrue(driver.queue_stopped)


if __name__ == "__main__":
    unittest.main()
