"""Evidence-scoped falsification cards for risk hypotheses."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
from hashlib import sha256
import math

from .models import Risk


@dataclass(frozen=True)
class FalsificationCard:
    card_id: str
    risk_id: str
    test: str
    metric: str
    operator: str
    threshold: float
    minimum_sample: int
    scope: str
    power_note: str
    decision_deadline: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class EvidenceResult:
    card_id: str
    observed: float
    sample_size: int
    scope: str
    completed_at: str
    review_hours: float


def _card_id(risk_id: str) -> str:
    return "FC-" + sha256(risk_id.encode()).hexdigest()[:10].upper()


def build_cards(
    risks: list[Risk], decision_deadline: str = "2026-11-15"
) -> list[FalsificationCard]:
    date.fromisoformat(decision_deadline)
    cards = []
    for risk in risks:
        common = {
            "card_id": _card_id(risk.risk_id),
            "risk_id": risk.risk_id,
            "scope": f"{risk.assumption}: {risk.mechanism}",
            "decision_deadline": decision_deadline,
        }
        if risk.persona == "engineering":
            card = FalsificationCard(
                **common,
                test="Run three failure-injection load trials at 2x declared peak.",
                metric="failed_task_rate", operator="<=", threshold=0.01,
                minimum_sample=3,
                power_note="Three trials screen repeatability; they do not cover untested traffic shapes.",
            )
        elif risk.persona == "legal":
            card = FalsificationCard(
                **common,
                test="Review every launch claim against approved evidence and obligations.",
                metric="claim_evidence_coverage", operator=">=", threshold=1.0,
                minimum_sample=1,
                power_note="Census of current claims only; later copy and jurisdictions remain out of scope.",
            )
        elif risk.persona == "finance":
            card = FalsificationCard(
                **common,
                test="Sample exception handling and calculate fully loaded cost.",
                metric="mean_exception_cost_usd", operator="<=", threshold=20.0,
                minimum_sample=30,
                power_note="Thirty synthetic exceptions detect large cost gaps, not rare tail losses.",
            )
        else:
            card = FalsificationCard(
                **common,
                test="Run task-based sessions with users matching the declared audience.",
                metric="task_completion_rate", operator=">=", threshold=0.85,
                minimum_sample=20,
                power_note="Twenty sessions screen common usability failures; accessibility segments need separate study.",
            )
        cards.append(card)
    return cards


def validate_cards(cards: list[FalsificationCard], risks: list[Risk]) -> list[str]:
    errors = []
    risk_ids = {risk.risk_id for risk in risks}
    seen = set()
    for card in cards:
        if card.card_id in seen:
            errors.append(f"{card.card_id}: duplicate card id")
        seen.add(card.card_id)
        if card.risk_id not in risk_ids:
            errors.append(f"{card.card_id}: unknown risk")
        if card.operator not in {"<=", ">="}:
            errors.append(f"{card.card_id}: invalid operator")
        if not math.isfinite(card.threshold):
            errors.append(f"{card.card_id}: threshold must be finite")
        if card.minimum_sample < 1:
            errors.append(f"{card.card_id}: minimum sample must be positive")
        if not card.test.strip() or not card.scope.strip() or not card.power_note.strip():
            errors.append(f"{card.card_id}: missing test, scope, or power note")
        try:
            date.fromisoformat(card.decision_deadline)
        except ValueError:
            errors.append(f"{card.card_id}: invalid deadline")
    if {card.risk_id for card in cards} != risk_ids:
        errors.append("cards must cover every risk exactly once")
    return errors


def evaluate_card(card: FalsificationCard, evidence: EvidenceResult) -> dict:
    if evidence.card_id != card.card_id:
        raise ValueError("evidence belongs to a different card")
    if not math.isfinite(evidence.observed) or not math.isfinite(evidence.review_hours):
        raise ValueError("evidence values must be finite")
    if evidence.review_hours < 0:
        raise ValueError("review hours must be non-negative")
    date.fromisoformat(evidence.completed_at)
    if evidence.scope != card.scope or evidence.sample_size < card.minimum_sample:
        status = "insufficient_evidence"
    else:
        passed = (
            evidence.observed <= card.threshold
            if card.operator == "<="
            else evidence.observed >= card.threshold
        )
        status = "retire_candidate" if passed else "keep"
    return {
        "card_id": card.card_id,
        "risk_id": card.risk_id,
        "status": status,
        "observed": evidence.observed,
        "threshold": card.threshold,
        "operator": card.operator,
        "sample_size": evidence.sample_size,
        "minimum_sample": card.minimum_sample,
        "review_hours": evidence.review_hours,
    }


def falsification_experiment(
    cards: list[FalsificationCard], evidence: list[EvidenceResult]
) -> dict:
    by_id = {item.card_id: item for item in evidence}
    if len(by_id) != len(evidence):
        raise ValueError("evidence card ids must be unique")
    if set(by_id) != {card.card_id for card in cards}:
        raise ValueError("evidence must cover every card exactly once")
    results = [evaluate_card(card, by_id[card.card_id]) for card in cards]
    resolved = sum(item["status"] == "retire_candidate" for item in results)
    hours = sum(item["review_hours"] for item in results)
    return {
        "cards": len(cards),
        "retire_candidates": resolved,
        "kept": sum(item["status"] == "keep" for item in results),
        "insufficient_evidence": sum(
            item["status"] == "insufficient_evidence" for item in results
        ),
        "review_hours": hours,
        "resolved_per_review_hour": resolved / hours if hours else None,
        "plain_register_resolved_per_review_hour": 0.0,
        "results": results,
    }
