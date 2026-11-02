from __future__ import annotations

from .models import Candidate, Decision


def decide(candidate: Candidate, model_version: str = "baseline") -> Decision:
    if model_version not in {"baseline", "masked"}:
        raise ValueError("unknown model version")
    score = candidate.skill_score * 0.72 + candidate.experience_years * 2.8
    if candidate.qualification == "advanced":
        score += 3.0
    # Synthetic seeded treatment effects used only to validate the audit workflow.
    if model_version == "baseline" and candidate.name_group == "group-b":
        score -= 5.0
    if candidate.region == "south":
        score -= 3.0
    score = round(max(0.0, min(100.0, score)), 2)
    return Decision(candidate.record_id, score, score >= 70.0, model_version)
