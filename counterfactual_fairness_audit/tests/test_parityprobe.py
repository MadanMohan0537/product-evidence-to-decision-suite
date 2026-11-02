import unittest
from dataclasses import replace

from parityprobe.counterfactuals import generate, suite
from parityprobe.data import candidates
from parityprobe.decision import decide
from parityprobe.demo import run_demo
from parityprobe.fixtures import intersection_fixture, validity_fixture
from parityprobe.intersections import plan_intersection_coverage
from parityprobe.metrics import accuracy, bootstrap_interval, pair_outcomes, summarize
from parityprobe.models import Counterfactual
from parityprobe.report import render_html
from parityprobe.validity import audit, filter_valid


class ParityProbeTests(unittest.TestCase):
    def setUp(self):
        self.records = candidates()

    def test_fixture_has_48_candidates(self):
        self.assertEqual(48, len(self.records))

    def test_fixture_has_both_labels(self):
        self.assertEqual({True, False}, {item.qualified for item in self.records})

    def test_name_swap_changes_linked_fields_only(self):
        pair = generate(self.records[0], "name_group")
        self.assertEqual(("name", "name_group"), pair.edited_fields)
        self.assertTrue(audit(pair).valid)

    def test_gender_swap_is_valid(self):
        self.assertTrue(audit(generate(self.records[2], "gender_marker")).valid)

    def test_zip_swap_is_consistent(self):
        pair = generate(self.records[0], "zip_proxy")
        self.assertTrue(audit(pair).valid)
        self.assertTrue(pair.variant.zip_code.startswith("20"))

    def test_unknown_attribute_rejected(self):
        with self.assertRaises(ValueError):
            generate(self.records[0], "unknown")

    def test_invariant_change_rejected(self):
        base = self.records[0]
        pair = Counterfactual("bad", "gender_marker", base, replace(base, gender_marker="female", skill_score=1), ("gender_marker", "skill_score"))
        self.assertFalse(audit(pair).valid)

    def test_inconsistent_zip_rejected(self):
        base = self.records[0]
        pair = Counterfactual("bad", "zip_proxy", base, replace(base, region="south"), ("region",))
        self.assertFalse(audit(pair).valid)

    def test_declared_edits_must_match(self):
        base = self.records[0]
        pair = Counterfactual("bad", "gender_marker", base, replace(base, gender_marker="female"), ("name",))
        self.assertFalse(audit(pair).valid)

    def test_generated_suite_has_three_pairs_per_candidate(self):
        self.assertEqual(144, len(suite(self.records)))

    def test_all_generated_pairs_pass_validity(self):
        valid, results = filter_valid(suite(self.records))
        self.assertEqual(len(results), len(valid))

    def test_baseline_name_bias_exceeds_masked(self):
        pairs = [generate(item, "name_group") for item in self.records]
        baseline = summarize(pair_outcomes(pairs, "baseline"))
        masked = summarize(pair_outcomes(pairs, "masked"))
        self.assertGreater(baseline["flip_rate"], masked["flip_rate"])

    def test_masking_keeps_accuracy_non_decreasing(self):
        self.assertGreaterEqual(accuracy(self.records, "masked"), accuracy(self.records, "baseline"))

    def test_bootstrap_interval_is_deterministic(self):
        values = [0.0, 1.0, 0.0, 1.0]
        self.assertEqual(bootstrap_interval(values), bootstrap_interval(values))

    def test_metrics_include_pair_denominator(self):
        rows = pair_outcomes([generate(item, "gender_marker") for item in self.records], "baseline")
        self.assertEqual(48, summarize(rows)["pairs"])

    def test_unknown_model_rejected(self):
        with self.assertRaises(ValueError):
            decide(self.records[0], "unknown")

    def test_validity_fixture_detects_every_invalid_case(self):
        outcomes = [(audit(pair).valid, expected) for pair, expected in validity_fixture()]
        self.assertTrue(all(actual == expected for actual, expected in outcomes))

    def test_demo_reports_no_false_positive_validity_rejections(self):
        self.assertEqual(0, run_demo()["validity"]["false_positives"])

    def test_demo_keeps_proxy_effect_visible(self):
        report = run_demo()
        self.assertGreater(report["models"]["masked"]["by_attribute"]["zip_proxy"]["flip_rate"], 0)

    def test_html_report_labels_limit(self):
        output = render_html(run_demo())
        self.assertIn("not a legal determination", output)
        self.assertIn("Mitigation comparison", output)

    def test_intersection_fixture_is_reproducible(self):
        self.assertEqual(intersection_fixture(), intersection_fixture())

    def test_intersection_denominators_reconcile(self):
        plan = plan_intersection_coverage(intersection_fixture())
        self.assertEqual(plan["total_pairs"], sum(cell["pairs"] for cell in plan["cells"]))

    def test_sparse_signal_is_visible_but_not_supported(self):
        plan = plan_intersection_coverage(intersection_fixture())
        sparse = next(cell for cell in plan["cells"] if cell["intersection"]["name_group"] == "group-b")
        self.assertTrue(sparse["signal"])
        self.assertEqual("insufficient", sparse["coverage"])
        self.assertEqual("signal observed; conclusion suppressed pending more cases", sparse["conclusion"])

    def test_coverage_planner_reports_exact_case_gap(self):
        plan = plan_intersection_coverage(intersection_fixture())
        sparse = next(cell for cell in plan["cells"] if cell["coverage"] == "insufficient")
        self.assertEqual(plan["minimum_pairs"] - sparse["pairs"], sparse["additional_pairs_needed"])

    def test_supported_control_does_not_report_disparity(self):
        plan = plan_intersection_coverage(intersection_fixture())
        control = next(cell for cell in plan["cells"] if cell["coverage"] == "supported")
        self.assertFalse(control["signal"])
        self.assertEqual("no supported disparity signal", control["conclusion"])

    def test_intersection_parameters_are_validated(self):
        with self.assertRaises(ValueError):
            plan_intersection_coverage(intersection_fixture(), minimum_pairs=0)

    def test_html_report_includes_coverage_caveat(self):
        output = render_html(run_demo())
        self.assertIn("Intersection coverage", output)
        self.assertIn("conclusions are suppressed", output)


if __name__ == "__main__":
    unittest.main()

