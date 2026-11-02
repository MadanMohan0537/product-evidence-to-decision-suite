from __future__ import annotations

import re

from .models import Risk


def _tokens(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z]+", text.lower()) if len(word) > 3}


def similarity(left: str, right: str) -> float:
    a, b = _tokens(left), _tokens(right)
    return len(a & b) / len(a | b) if a | b else 1.0


def merge_risks(risks: list[Risk], threshold: float = 0.72) -> list[Risk]:
    ordered = sorted(risks, key=lambda risk: (-risk.score, risk.risk_id))
    kept: list[Risk] = []
    for risk in ordered:
        if not any(risk.assumption == item.assumption and similarity(risk.title, item.title) >= threshold for item in kept):
            kept.append(risk)
    return kept


def validate_register(risks: list[Risk]) -> list[str]:
    errors: list[str] = []
    for risk in risks:
        if len(risk.mechanism.split()) < 8:
            errors.append(f"{risk.risk_id}: vague mechanism")
        if not risk.owner or not risk.mitigation:
            errors.append(f"{risk.risk_id}: missing owner or mitigation")
        if not (1 <= risk.likelihood <= 5 and 1 <= risk.impact <= 5):
            errors.append(f"{risk.risk_id}: score out of range")
    return errors
