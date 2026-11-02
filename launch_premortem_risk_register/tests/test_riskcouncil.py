import unittest
from dataclasses import replace

from riskcouncil.compare import compare_human, intervention_delta
from riskcouncil.debate import run_debate
from riskcouncil.demo import run_demo
from riskcouncil.generator import propose
from riskcouncil.models import LaunchBrief, Risk
from riskcouncil.moderator import merge_risks, similarity, validate_register
from riskcouncil.personas import DEFAULT_PERSONAS


class RiskCouncilTests(unittest.TestCase):
    def setUp(self):
        self.brief = LaunchBrief("Test", "A launch", {"audience": "small pilot of 100 customers", "support": "specialist review"})

    def test_all_personas_have_private_context(self):
        self.assertTrue(all(persona.private_context for persona in DEFAULT_PERSONAS))

    def test_proposal_per_assumption(self):
        self.assertEqual(2, len(propose(DEFAULT_PERSONAS[0], self.brief)))

    def test_risks_have_mechanisms(self):
        risks = run_debate(self.brief, DEFAULT_PERSONAS).risks
        self.assertFalse(validate_register(risks))

    def test_fixed_rounds_present(self):
        rounds = {note.round for note in run_debate(self.brief, DEFAULT_PERSONAS).notes}
        self.assertEqual({"propose", "rebut", "concede"}, rounds)

    def test_every_risk_is_rebutted(self):
        result = run_debate(self.brief, DEFAULT_PERSONAS)
        rebutted = {note.risk_id for note in result.notes if note.round == "rebut"}
        self.assertEqual({risk.risk_id for risk in result.risks}, rebutted)

    def test_scores_in_range(self):
        for risk in run_debate(self.brief, DEFAULT_PERSONAS).risks:
            self.assertGreaterEqual(risk.score, 1)
            self.assertLessEqual(risk.score, 25)

    def test_large_audience_increases_likelihood(self):
        small = propose(DEFAULT_PERSONAS[0], self.brief)[0]
        large_brief = replace(self.brief, assumptions={**self.brief.assumptions, "audience": "global launch to all 10,000 customers"})
        large = propose(DEFAULT_PERSONAS[0], large_brief)[0]
        self.assertGreater(large.likelihood, small.likelihood)

    def test_intervention_is_targeted(self):
        base = merge_risks(run_debate(self.brief, DEFAULT_PERSONAS).risks)
        variant_brief = replace(self.brief, assumptions={**self.brief.assumptions, "audience": "global launch to all 10,000 customers"})
        variant = merge_risks(run_debate(variant_brief, DEFAULT_PERSONAS).risks)
        result = intervention_delta(base, variant, "audience")
        self.assertTrue(result["targeted"])
        self.assertTrue(result["changed"])
        self.assertTrue(result["unchanged_controls"])

    def test_intervention_records_denominators(self):
        report = run_demo()["intervention"]
        self.assertEqual(4, len(report["changed"]))
        self.assertEqual(4, len(report["unchanged_controls"]))

    def test_similarity_identical(self):
        self.assertEqual(1.0, similarity("capacity failure", "capacity failure"))

    def test_merge_removes_duplicate(self):
        risk = Risk("a", "engineering", "Capacity failure risk", "Traffic causes retry storm beyond tested capacity limits.", 4, 5, "eng", "load test", "traffic")
        duplicate = replace(risk, risk_id="b")
        self.assertEqual(1, len(merge_risks([risk, duplicate])))

    def test_merge_keeps_different_assumptions(self):
        risk = Risk("a", "engineering", "Capacity failure risk", "Traffic causes retry storm beyond tested capacity limits.", 4, 5, "eng", "load test", "traffic")
        other = replace(risk, risk_id="b", assumption="region")
        self.assertEqual(2, len(merge_risks([risk, other])))

    def test_comparison_records_counts(self):
        risks = merge_risks(run_debate(self.brief, DEFAULT_PERSONAS).risks)
        result = compare_human(risks, [risks[0].title, "Unrelated supply issue"])
        self.assertEqual(2, result["human_risks"])
        self.assertGreaterEqual(result["human_risks_matched"], 1)

    def test_empty_human_list_has_no_fake_recall(self):
        result = compare_human([], [])
        self.assertIsNone(result["human_recall"])

    def test_demo_has_no_register_errors(self):
        self.assertEqual([], run_demo()["register_errors"])

    def test_demo_exports_markdown(self):
        self.assertIn("## Risk register", run_demo()["markdown"])


if __name__ == "__main__":
    unittest.main()
