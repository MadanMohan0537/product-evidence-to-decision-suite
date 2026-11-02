from __future__ import annotations

from dataclasses import replace

from .compare import compare_human, intervention_delta
from .debate import run_debate
from .models import LaunchBrief
from .moderator import merge_risks, validate_register
from .personas import DEFAULT_PERSONAS
from .report import markdown_report
from .falsification import (
    EvidenceResult, build_cards, falsification_experiment, validate_cards,
)


def run_demo() -> dict:
    baseline_brief = LaunchBrief(
        "Atlas launch",
        "Launch an AI-assisted support workflow to a controlled customer cohort.",
        {"audience": "small pilot of 100 customers", "support_model": "specialist review for every exception"},
    )
    variant_brief = replace(baseline_brief, assumptions={**baseline_brief.assumptions, "audience": "global launch to all 10,000 customers"})
    baseline_debate = run_debate(baseline_brief, DEFAULT_PERSONAS)
    variant_debate = run_debate(variant_brief, DEFAULT_PERSONAS)
    baseline = merge_risks(baseline_debate.risks)
    variant = merge_risks(variant_debate.risks)
    human = ["Launch load exceeds the tested operating envelope", "Mainstream users fail the new workflow", "Training backlog slows support"]
    comparison = compare_human(baseline, human)
    intervention = intervention_delta(baseline, variant, "audience")
    cards = build_cards(baseline)
    evidence = []
    for index, card in enumerate(cards):
        if card.operator == "<=":
            observed = card.threshold * (0.8 if index % 2 == 0 else 1.2)
        else:
            observed = min(1.0, card.threshold + 0.05) if index % 2 == 0 else card.threshold - 0.10
        evidence.append(EvidenceResult(
            card.card_id, observed, card.minimum_sample, card.scope,
            "2026-11-10", 0.5,
        ))
    falsification = falsification_experiment(cards, evidence)
    return {
        "brief": baseline_brief,
        "risk_count": len(baseline),
        "debate_notes": len(baseline_debate.notes),
        "register_errors": validate_register(baseline),
        "comparison": comparison,
        "intervention": intervention,
        "falsification_cards": [card.to_dict() for card in cards],
        "falsification_errors": validate_cards(cards, baseline),
        "falsification_experiment": falsification,
        "markdown": markdown_report(
            baseline_brief, baseline, comparison, intervention, cards,
            falsification,
        ),
    }

