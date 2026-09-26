import importlib.util
import pathlib
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "benchmark-pyto.py"
SPEC = importlib.util.spec_from_file_location("benchmark_pyto", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

class PytoBenchmarkTests(unittest.TestCase):
    def test_percentiles(self):
        values = [10, 20, 30, 40, 50]
        self.assertEqual(MODULE.percentile(values, 50), 30)
        self.assertEqual(MODULE.percentile(values, 95), 48)
        self.assertEqual(MODULE.percentile(values, 99), 49.6)

    def test_summary(self):
        result = MODULE.summarize([10, 20, 30, 40, 50])
        self.assertEqual(result["samples"], 5)
        self.assertEqual(result["median"], 30)
        self.assertEqual(result["p95"], 48)
        self.assertEqual(result["p99"], 49.6)

if __name__ == "__main__":
    unittest.main()
