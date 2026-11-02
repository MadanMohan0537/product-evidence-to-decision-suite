import unittest

from backend.app.metrics import DIMENSIONS, get_metric


class MetricTests(unittest.TestCase):
    def test_activation_contract(self):
        metric = get_metric("Activation")
        self.assertEqual(metric.numerator_event, "onboarding_completed")
        self.assertEqual(metric.denominator_event, "signup")

    def test_unknown_metric_fails(self):
        with self.assertRaisesRegex(ValueError, "unknown metric"):
            get_metric("revenue")

    def test_all_required_dimensions_exist(self):
        self.assertEqual(len(DIMENSIONS), 8)
        self.assertIn("app_version", DIMENSIONS)
        self.assertIn("onboarding_step", DIMENSIONS)


if __name__ == "__main__":
    unittest.main()
