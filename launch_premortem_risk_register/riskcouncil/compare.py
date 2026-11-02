from __future__ import annotations

from .models import Risk
from .moderator import similarity


def compare_human(agent_risks: list[Risk], human_titles: list[str], threshold: float = 0.35) -> dict:
    matched_human = sum(any(similarity(title, risk.title) >= threshold for risk in agent_risks) for title in human_titles)
    novel_agent = sum(not any(similarity(risk.title, title) >= threshold for title in human_titles) for risk in agent_risks)
    return {
        "human_risks": len(human_titles),
        "agent_risks": len(agent_risks),
        "human_risks_matched": matched_human,
        "human_recall": matched_human / len(human_titles) if human_titles else None,
        "agent_risks_novel_to_human_list": novel_agent,
    }


def intervention_delta(baseline: list[Risk], variant: list[Risk], changed_assumption: str) -> dict:
    base = {(r.persona, r.assumption): r for r in baseline}
    changed = []
    unchanged = []
    for risk in variant:
        prior = base.get((risk.persona, risk.assumption))
        row = {
            "persona": risk.persona,
            "assumption": risk.assumption,
            "before_likelihood": prior.likelihood if prior else None,
            "after_likelihood": risk.likelihood,
            "mechanism_changed": bool(prior and prior.mechanism != risk.mechanism),
        }
        (changed if risk.assumption == changed_assumption else unchanged).append(row)
    targeted = all(row["mechanism_changed"] for row in changed) and all(not row["mechanism_changed"] for row in unchanged)
    return {"changed_assumption": changed_assumption, "targeted": targeted, "changed": changed, "unchanged_controls": unchanged}
