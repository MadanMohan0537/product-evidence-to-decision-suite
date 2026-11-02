from __future__ import annotations

import math
from collections import defaultdict

from .metrics import pair_outcomes
from .models import Counterfactual


def _wilson_interval(successes: int, total: int, z: float = 1.96) -> list[float]:
    if total == 0:
        return [0.0, 1.0]
    proportion = successes / total
    denominator = 1 + z * z / total
    centre = (proportion + z * z / (2 * total)) / denominator
    margin = z * math.sqrt((proportion * (1 - proportion) + z * z / (4 * total)) / total) / denominator
    return [round(max(0.0, centre - margin), 4), round(min(1.0, centre + margin), 4)]


def plan_intersection_coverage(
    pairs: list[Counterfactual],
    model_version: str = "baseline",
    minimum_pairs: int = 12,
    signal_threshold: float = 0.2,
) -> dict:
    """Measure intersection signals while suppressing conclusions below coverage."""
    if minimum_pairs < 1:
        raise ValueError("minimum_pairs must be positive")
    if not 0 <= signal_threshold <= 1:
        raise ValueError("signal_threshold must be between 0 and 1")

    outcomes = {row["pair_id"]: row for row in pair_outcomes(pairs, model_version)}
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for pair in pairs:
        groups[(pair.original.name_group, pair.original.region)].append(outcomes[pair.pair_id])

    cells = []
    for (name_group, region), rows in sorted(groups.items()):
        count = len(rows)
        flips = sum(bool(row["flip"]) for row in rows)
        rate = flips / count
        supported = count >= minimum_pairs
        signal = rate >= signal_threshold
        cells.append({
            "intersection": {"name_group": name_group, "region": region},
            "pairs": count,
            "flips": flips,
            "flip_rate": round(rate, 4),
            "flip_rate_ci": _wilson_interval(flips, count),
            "additional_pairs_needed": max(0, minimum_pairs - count),
            "coverage": "supported" if supported else "insufficient",
            "signal": signal,
            "conclusion": (
                "supported disparity signal" if supported and signal
                else "no supported disparity signal" if supported
                else "signal observed; conclusion suppressed pending more cases" if signal
                else "conclusion suppressed pending more cases"
            ),
        })

    return {
        "dimensions": ["name_group", "region"],
        "model_version": model_version,
        "minimum_pairs": minimum_pairs,
        "signal_threshold": signal_threshold,
        "total_pairs": len(pairs),
        "cells": cells,
    }
