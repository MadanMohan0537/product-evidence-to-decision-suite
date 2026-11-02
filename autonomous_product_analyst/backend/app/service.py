"""Question parsing and analysis orchestration."""

import re

from .explainer import explain
from .investigator import investigate
from .metrics import METRICS


def parse_question(question: str) -> str:
    normalized = str(question or "").strip().lower()
    if not normalized:
        raise ValueError("question must not be empty")
    matches = [name for name in METRICS if re.search(rf"\b{name}\b", normalized)]
    if not matches:
        raise ValueError(f"question must name a governed metric: {', '.join(METRICS)}")
    return matches[0]


def analyze_question(database, question: str, end: str | None = None, window_days: int = 7) -> dict:
    metric = parse_question(question)
    investigation = investigate(database, metric, end, window_days)
    return {"schema_version": "1.0.0", "explanation": explain(investigation, question), "investigation": investigation}
