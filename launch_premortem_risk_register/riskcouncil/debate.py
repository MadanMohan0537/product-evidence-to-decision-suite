from __future__ import annotations

from .generator import propose
from .models import DebateNote, LaunchBrief, Persona, PremortemResult, Risk


def run_debate(brief: LaunchBrief, personas: tuple[Persona, ...]) -> PremortemResult:
    risks: list[Risk] = []
    notes: list[DebateNote] = []
    for persona in personas:
        for risk in propose(persona, brief):
            risks.append(risk)
            notes.append(DebateNote("propose", persona.name, risk.risk_id, risk.mechanism))

    for index, risk in enumerate(risks):
        challenger = personas[(index + 1) % len(personas)].name
        notes.append(DebateNote("rebut", challenger, risk.risk_id, f"Demand evidence for likelihood {risk.likelihood}; mechanism retained until tested."))
        concession = (
            "Downgrade priority, but keep as a labeled hypothesis."
            if risk.score < 12
            else "No priority concession; accept that likelihood still requires evidence."
        )
        notes.append(DebateNote("concede", risk.persona, risk.risk_id, concession))
    return PremortemResult(brief, risks, notes)
