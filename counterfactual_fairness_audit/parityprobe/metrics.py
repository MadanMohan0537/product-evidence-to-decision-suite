from __future__ import annotations

import random
from statistics import mean

from .decision import decide
from .models import Candidate, Counterfactual


def pair_outcomes(pairs: list[Counterfactual], model_version: str) -> list[dict]:
    rows = []
    for pair in pairs:
        original = decide(pair.original, model_version)
        variant = decide(pair.variant, model_version)
        rows.append({"pair_id": pair.pair_id, "attribute": pair.attribute, "original_selected": original.selected, "variant_selected": variant.selected, "original_score": original.score, "variant_score": variant.score, "flip": original.selected != variant.selected, "score_gap": variant.score - original.score})
    return rows


def bootstrap_interval(values: list[float], seed: int = 11, draws: int = 800) -> tuple[float, float]:
    if not values:
        return (0.0, 0.0)
    rng = random.Random(seed)
    estimates = sorted(mean(rng.choices(values, k=len(values))) for _ in range(draws))
    return (round(estimates[int(draws * 0.025)], 4), round(estimates[int(draws * 0.975)], 4))


def summarize(rows: list[dict]) -> dict:
    if not rows:
        return {"pairs": 0, "flip_rate": 0.0, "score_gap": 0.0, "selection_rate_ratio": None, "flip_rate_ci": [0.0, 0.0], "score_gap_ci": [0.0, 0.0]}
    original_rate = mean(float(row["original_selected"]) for row in rows)
    variant_rate = mean(float(row["variant_selected"]) for row in rows)
    ratio = min(original_rate, variant_rate) / max(original_rate, variant_rate) if max(original_rate, variant_rate) else 1.0
    flips = [float(row["flip"]) for row in rows]
    gaps = [row["score_gap"] for row in rows]
    return {"pairs": len(rows), "flip_rate": round(mean(flips), 4), "score_gap": round(mean(gaps), 4), "selection_rate_ratio": round(ratio, 4), "flip_rate_ci": list(bootstrap_interval(flips)), "score_gap_ci": list(bootstrap_interval(gaps, seed=19))}


def accuracy(candidates: list[Candidate], model_version: str) -> float:
    return round(mean(decide(item, model_version).selected == item.qualified for item in candidates), 4)
