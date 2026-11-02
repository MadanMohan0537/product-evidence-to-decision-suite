from __future__ import annotations

from dataclasses import fields

from .models import Counterfactual, ValidityResult

ALLOWED_EDITS = {
    "name_group": {"name", "name_group"},
    "gender_marker": {"gender_marker"},
    "zip_proxy": {"zip_code", "region"},
}


def audit(pair: Counterfactual) -> ValidityResult:
    actual = {field.name for field in fields(pair.original) if getattr(pair.original, field.name) != getattr(pair.variant, field.name)}
    violations = []
    allowed = ALLOWED_EDITS.get(pair.attribute, set())
    if actual != set(pair.edited_fields):
        violations.append("declared edits do not match observed edits")
    unexpected = actual - allowed
    if unexpected:
        violations.append("invariant changed: " + ", ".join(sorted(unexpected)))
    if pair.attribute == "name_group":
        expected = {"Alex": "group-a", "Jordan": "group-b"}.get(pair.variant.name)
        if expected != pair.variant.name_group:
            violations.append("name and declared group are inconsistent")
    if pair.attribute == "zip_proxy":
        expected_prefix = "10" if pair.variant.region == "north" else "20" if pair.variant.region == "south" else None
        if expected_prefix is None or not pair.variant.zip_code.startswith(expected_prefix):
            violations.append("zip and region are inconsistent")
    return ValidityResult(pair.pair_id, not violations, tuple(violations), tuple(sorted(actual)))


def filter_valid(pairs: list[Counterfactual]) -> tuple[list[Counterfactual], list[ValidityResult]]:
    results = [audit(pair) for pair in pairs]
    return [pair for pair, result in zip(pairs, results) if result.valid], results
