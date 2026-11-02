from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Candidate:
    record_id: str
    skill_score: int
    experience_years: int
    qualification: str
    name: str
    name_group: str
    gender_marker: str
    zip_code: str
    region: str
    qualified: bool


@dataclass(frozen=True)
class Decision:
    record_id: str
    score: float
    selected: bool
    model_version: str


@dataclass(frozen=True)
class Counterfactual:
    pair_id: str
    attribute: str
    original: Candidate
    variant: Candidate
    edited_fields: tuple[str, ...]


@dataclass(frozen=True)
class ValidityResult:
    pair_id: str
    valid: bool
    violations: tuple[str, ...]
    edited_fields: tuple[str, ...]
