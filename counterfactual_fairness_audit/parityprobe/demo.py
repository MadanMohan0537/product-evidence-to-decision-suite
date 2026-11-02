from __future__ import annotations

from .counterfactuals import suite
from .data import candidates
from .fixtures import intersection_fixture, validity_fixture
from .intersections import plan_intersection_coverage
from .metrics import accuracy, pair_outcomes, summarize
from .validity import audit, filter_valid


def run_demo() -> dict:
    records = candidates()
    pairs, validity = filter_valid(suite(records))
    models = {}
    for version in ("baseline", "masked"):
        outcomes = pair_outcomes(pairs, version)
        models[version] = {
            "overall": summarize(outcomes),
            "by_attribute": {attribute: summarize([row for row in outcomes if row["attribute"] == attribute]) for attribute in ("name_group", "gender_marker", "zip_proxy")},
            "accuracy": accuracy(records, version),
        }
    fixture = validity_fixture()
    results = [(audit(pair), expected) for pair, expected in fixture]
    invalid = sum(not expected for _, expected in results)
    detected = sum(not result.valid and not expected for result, expected in results)
    false_positives = sum(not result.valid and expected for result, expected in results)
    return {
        "project": "ParityProbe",
        "catalog_trace": {"number": 11, "original_title": "Fairness Audit Workbench"},
        "dataset": {"synthetic_candidates": len(records), "counterfactual_pairs": len(pairs), "rejected_generated_pairs": sum(not item.valid for item in validity)},
        "models": models,
        "validity": {"fixture_cases": len(fixture), "invalid_fixture": invalid, "detected_invalid": detected, "false_positives": false_positives, "results": [{"pair_id": result.pair_id, "expected_valid": expected, "actual_valid": result.valid, "violations": result.violations, "edited_fields": result.edited_fields} for result, expected in results]},
        "intersection_coverage": plan_intersection_coverage(intersection_fixture()),
    }

