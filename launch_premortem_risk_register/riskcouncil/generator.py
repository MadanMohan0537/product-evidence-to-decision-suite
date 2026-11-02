from __future__ import annotations

import hashlib

from .models import LaunchBrief, Persona, Risk


def _id(persona: str, assumption: str, title: str) -> str:
    return hashlib.sha1(f"{persona}|{assumption}|{title}".encode()).hexdigest()[:10]


def _risk(persona: Persona, assumption: str, value: str) -> Risk:
    low = f"{assumption} {value}".lower()
    if persona.name == "engineering":
        title = "Launch load exceeds the tested operating envelope"
        mechanism = f"The declared {assumption} assumption ({value}) drives burst traffic and retries beyond validated capacity."
        likelihood, impact, owner = 4, 5, "engineering"
        mitigation = "Run a failure-injection load test at 2× the declared peak and publish abort thresholds."
    elif persona.name == "legal":
        title = "Launch claims outrun reviewed obligations"
        mechanism = f"The {assumption} assumption ({value}) changes who sees claims or which obligations attach before review is complete."
        likelihood, impact, owner = 3, 5, "legal"
        mitigation = "Map each launch claim to approved evidence and block unsupported wording."
    elif persona.name == "finance":
        title = "Exception handling erases expected margin"
        mechanism = f"The {assumption} assumption ({value}) raises review, support, or remediation volume absent from unit economics."
        likelihood, impact, owner = 4, 4, "finance"
        mitigation = "Model downside cost per exception and set a stop-loss trigger."
    else:
        title = "Mainstream users fail the new workflow"
        mechanism = f"The {assumption} assumption ({value}) shifts the audience or workflow faster than onboarding and support can absorb."
        likelihood, impact, owner = 3, 4, "product"
        mitigation = "Run task-based usability sessions and stage access by demonstrated completion rate."
    if any(term in low for term in ("small", "internal", "pilot", "100")):
        likelihood = max(1, likelihood - 1)
    if any(term in low for term in ("global", "all", "10,000", "enterprise")):
        likelihood = min(5, likelihood + 1)
    return Risk(_id(persona.name, assumption, title), persona.name, title, mechanism, likelihood, impact, owner, mitigation, assumption)


def propose(persona: Persona, brief: LaunchBrief) -> list[Risk]:
    """One mechanism-bearing risk per named assumption keeps output auditable."""
    return [_risk(persona, key, value) for key, value in sorted(brief.assumptions.items())]
