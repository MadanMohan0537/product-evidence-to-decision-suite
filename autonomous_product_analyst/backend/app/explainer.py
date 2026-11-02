"""Evidence-bound PM explanation generation."""


def _percent(value: float | None, signed: bool = False) -> str:
    if value is None:
        return "not available"
    return f"{value * 100:+.1f}%" if signed else f"{value * 100:.1f}%"


def explain(result: dict, question: str = "") -> dict:
    current = result["periods"]["current"]
    previous = result["periods"]["previous"]
    top = result.get("primary_contributor")
    direction = "fell" if result["delta"] < 0 else "rose" if result["delta"] > 0 else "was unchanged"
    summary = f"{result['metric']['name'].title()} {direction} {_percent(abs(result['delta']))} points, from {_percent(previous['rate'])} to {_percent(current['rate'])}."
    if top:
        contributor = f"The largest measured contributor was {top['dimension'].replace('_', ' ')} = {top['value']}, which changed {_percent(top['delta'], signed=True)} points and represented {top['current']['denominator']} current-period users."
    else:
        contributor = "No segment-level contributor could be identified from the available sample."
    release = result.get("releases", [None])[0] if result.get("releases") else None
    release_note = f"Release {release['version']} occurred in the comparison window: {release['notes']}" if release else "No release was recorded in the comparison window."
    confidence = "high" if result["overall_z_score"] >= 2.58 and top and top["sample_size"] >= 100 else "medium" if result["overall_z_score"] >= 1.96 else "low"
    return {
        "question": question,
        "answer": summary,
        "primary_contributor": contributor,
        "release_context": release_note,
        "confidence": confidence,
        "recommended_investigation": f"Inspect {top['dimension'].replace('_', ' ')} '{top['value']}' and reproduce the affected funnel around {release['version']}." if top and release else f"Validate instrumentation and review the {top['dimension'].replace('_', ' ')} '{top['value']}' journey." if top else "Validate event coverage and collect a larger comparison sample.",
        "guardrail": "This is a ranked statistical association, not proof of causation.",
    }
