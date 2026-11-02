import unittest
from dataclasses import replace

from riskcouncil.debate import run_debate
from riskcouncil.falsification import (
    EvidenceResult, build_cards, evaluate_card, falsification_experiment,
    validate_cards,
)
from riskcouncil.models import LaunchBrief
from riskcouncil.moderator import merge_risks
from riskcouncil.personas import DEFAULT_PERSONAS


class FalsificationTests(unittest.TestCase):
    def setUp(self):
        brief = LaunchBrief(
            "Test", "A launch",
            {"audience": "100-customer pilot", "support": "specialist review"},
        )
        self.risks = merge_risks(run_debate(brief, DEFAULT_PERSONAS).risks)
        self.cards = build_cards(self.risks, "2026-11-15")

    def evidence(self, card, observed, sample_size=None, scope=None, hours=0.5):
        return EvidenceResult(
            card.card_id, observed,
            card.minimum_sample if sample_size is None else sample_size,
            card.scope if scope is None else scope,
            "2026-11-10", hours,
        )

    def test_cards_cover_every_risk_and_validate(self):
        self.assertEqual(len(self.cards), len(self.risks))
        self.assertEqual([], validate_cards(self.cards, self.risks))
        self.assertTrue(all(card.power_note and card.scope for card in self.cards))

    def test_passing_evidence_creates_retire_candidate(self):
        card = next(item for item in self.cards if item.operator == ">=")
        result = evaluate_card(card, self.evidence(card, card.threshold))
        self.assertEqual(result["status"], "retire_candidate")

    def test_failing_evidence_keeps_risk(self):
        card = next(item for item in self.cards if item.operator == "<=")
        result = evaluate_card(card, self.evidence(card, card.threshold + 1))
        self.assertEqual(result["status"], "keep")

    def test_small_or_wrong_scope_sample_is_never_treated_as_safety(self):
        card = self.cards[0]
        small = self.evidence(card, card.threshold, card.minimum_sample - 1)
        wrong_scope = self.evidence(card, card.threshold, scope="different launch")
        self.assertEqual(evaluate_card(card, small)["status"], "insufficient_evidence")
        self.assertEqual(evaluate_card(card, wrong_scope)["status"], "insufficient_evidence")

    def test_experiment_records_denominators_and_review_efficiency(self):
        evidence = []
        for index, card in enumerate(self.cards):
            observed = card.threshold if index % 2 == 0 else (
                card.threshold + 1 if card.operator == "<=" else card.threshold - 1
            )
            evidence.append(self.evidence(card, observed))
        result = falsification_experiment(self.cards, evidence)
        self.assertEqual(result["cards"], len(self.cards))
        self.assertEqual(result["retire_candidates"], len(self.cards) // 2)
        self.assertGreater(result["resolved_per_review_hour"], 0)
        self.assertEqual(result["plain_register_resolved_per_review_hour"], 0)

    def test_experiment_requires_exact_evidence_coverage(self):
        card = self.cards[0]
        with self.assertRaises(ValueError):
            falsification_experiment(self.cards, [self.evidence(card, card.threshold)])

    def test_invalid_card_contract_is_reported(self):
        broken = replace(self.cards[0], power_note="", minimum_sample=0)
        errors = validate_cards([broken, *self.cards[1:]], self.risks)
        self.assertTrue(any("minimum sample" in item for item in errors))
        self.assertTrue(any("missing test" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
