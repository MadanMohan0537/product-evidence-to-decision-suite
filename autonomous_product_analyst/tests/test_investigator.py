import tempfile
import unittest
from pathlib import Path

from backend.app.database import Database
from backend.app.service import analyze_question, parse_question
from scripts.generate_data import generate


class InvestigatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.path = str(Path(cls.temp.name) / "test.db")
        generate(cls.path)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_question_requires_governed_metric(self):
        self.assertEqual(parse_question("Why did ACTIVATION fall?"), "activation")
        with self.assertRaisesRegex(ValueError, "governed metric"):
            parse_question("What happened last week?")

    def test_finds_planted_activation_drop(self):
        result = analyze_question(Database(self.path), "Why did activation fall last week?", "2026-09-01")
        investigation = result["investigation"]
        self.assertLess(investigation["delta"], 0)
        self.assertGreater(investigation["overall_z_score"], 1.96)
        self.assertEqual(investigation["primary_contributor"]["dimension"], "platform")
        self.assertEqual(investigation["primary_contributor"]["value"], "android")

    def test_investigates_every_required_dimension(self):
        result = analyze_question(Database(self.path), "Explain activation", "2026-09-01")
        self.assertEqual(len(result["investigation"]["dimensions_investigated"]), 8)
        self.assertGreater(len(result["investigation"]["contributors"]), 0)

    def test_correlates_release_without_claiming_causation(self):
        result = analyze_question(Database(self.path), "Explain activation", "2026-09-01")
        self.assertEqual(result["investigation"]["releases"][0]["version"], "4.18")
        self.assertIn("not proof of causation", result["explanation"]["guardrail"])

    def test_other_governed_metrics_run(self):
        result = analyze_question(Database(self.path), "How did conversion change?", "2026-09-01")
        self.assertEqual(result["investigation"]["metric"]["name"], "conversion")


if __name__ == "__main__":
    unittest.main()
