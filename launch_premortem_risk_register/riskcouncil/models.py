from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class LaunchBrief:
    name: str
    summary: str
    assumptions: dict[str, str]


@dataclass(frozen=True)
class Persona:
    name: str
    goal: str
    private_context: str
    forbidden_moves: tuple[str, ...] = ()


@dataclass(frozen=True)
class Risk:
    risk_id: str
    persona: str
    title: str
    mechanism: str
    likelihood: int
    impact: int
    owner: str
    mitigation: str
    assumption: str
    hypothesis: bool = True

    @property
    def score(self) -> int:
        return self.likelihood * self.impact


@dataclass(frozen=True)
class DebateNote:
    round: str
    persona: str
    risk_id: str
    text: str


@dataclass
class PremortemResult:
    brief: LaunchBrief
    risks: list[Risk] = field(default_factory=list)
    notes: list[DebateNote] = field(default_factory=list)
