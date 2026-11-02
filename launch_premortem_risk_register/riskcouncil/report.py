from __future__ import annotations

from .models import LaunchBrief, Risk
from .falsification import FalsificationCard


def markdown_report(
    brief: LaunchBrief, risks: list[Risk], comparison: dict, intervention: dict,
    cards: list[FalsificationCard] | None = None,
    falsification: dict | None = None,
) -> str:
    lines = [f"# {brief.name} premortem", "", brief.summary, "", "## Risk register", "", "| Score | Risk | Mechanism | Owner | Mitigation |", "|---:|---|---|---|---|"]
    for risk in sorted(risks, key=lambda r: (-r.score, r.title)):
        lines.append(f"| {risk.score} | {risk.title} | {risk.mechanism} | {risk.owner} | {risk.mitigation} |")
    if cards:
        lines += ["", "## Falsification cards", "", "| Risk | Test | Threshold | Scope | Deadline |", "|---|---|---|---|---|"]
        by_id = {risk.risk_id: risk for risk in risks}
        for card in cards:
            lines.append(
                f"| {by_id[card.risk_id].title} | {card.test} | "
                f"{card.metric} {card.operator} {card.threshold} "
                f"(n≥{card.minimum_sample}) | {card.scope} | "
                f"{card.decision_deadline} |"
            )
    lines += ["", "## Evaluation", "", f"- Human-list recall: {comparison['human_recall']}", f"- Risks novel to human list: {comparison['agent_risks_novel_to_human_list']}", f"- Assumption intervention targeted: {intervention['targeted']}"]
    if falsification:
        lines += [
            f"- Falsification retire candidates: {falsification['retire_candidates']}/{falsification['cards']}",
            f"- Resolved per review hour: {falsification['resolved_per_review_hour']}",
        ]
    lines += ["", "> Generated risks are hypotheses for review, not predictions or professional advice."]
    return "\n".join(lines) + "\n"

