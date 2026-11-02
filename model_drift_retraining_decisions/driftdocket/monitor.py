"""Dependency-free drift statistics and decision policy."""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json
from math import log, sqrt
from random import Random
from statistics import mean
from typing import Iterable

EPS = 1e-6

def _reference_fingerprint(batch: "Batch") -> str:
    payload={"features":batch.features,"rows":len(batch.predictions)}
    return hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def _edges(values: list[float], bins: int) -> list[float]:
    ordered = sorted(values)
    return [ordered[min(len(ordered)-1, int(i*len(ordered)/bins))] for i in range(1, bins)]

def _shares(values: list[float], edges: list[float]) -> list[float]:
    counts = [0] * (len(edges)+1)
    for value in values:
        counts[sum(value > edge for edge in edges)] += 1
    return [max(EPS, count/len(values)) for count in counts]

def psi(reference: list[float], current: list[float], bins: int = 10) -> float:
    if not reference or not current: raise ValueError("samples must be non-empty")
    edges = _edges(reference, bins)
    expected, actual = _shares(reference, edges), _shares(current, edges)
    return sum((a-e)*log(a/e) for e,a in zip(expected, actual))

def ks(reference: list[float], current: list[float]) -> float:
    if not reference or not current: raise ValueError("samples must be non-empty")
    points = sorted(set(reference+current))
    return max(abs(sum(x<=p for x in reference)/len(reference)-sum(x<=p for x in current)/len(current)) for p in points)

@dataclass(frozen=True)
class Batch:
    month: str
    features: dict[str, list[float]]
    predictions: list[float]
    outcomes: list[float | None]
    outcome_ages_days: list[int]

    def __post_init__(self) -> None:
        n=len(self.predictions)
        if not n or len(self.outcomes)!=n or len(self.outcome_ages_days)!=n or any(len(v)!=n for v in self.features.values()):
            raise ValueError("all batch columns must be aligned and non-empty")

@dataclass(frozen=True)
class TicketPolicy:
    psi_warning: float = .20
    ks_warning: float = .25
    mae_drop: float = .12
    min_mature_labels: int = 30
    maturity_days: int = 30
    training_hours: float = 2.0
    hourly_compute_cost: float = .60
    engineer_hours: float = 3.0
    hourly_engineer_cost: float = 80.0

    def __post_init__(self) -> None:
        if not 0 <= self.psi_warning or not 0 <= self.ks_warning <= 1:
            raise ValueError("drift thresholds must be non-negative and KS cannot exceed 1")
        if not 0 <= self.mae_drop or self.min_mature_labels < 1 or self.maturity_days < 0:
            raise ValueError("performance thresholds and maturity requirements are invalid")
        if min(self.training_hours,self.hourly_compute_cost,self.engineer_hours,self.hourly_engineer_cost) < 0:
            raise ValueError("cost inputs cannot be negative")

@dataclass(frozen=True)
class AlarmBudget:
    reference_fingerprint: str
    monthly_budget: float
    psi_threshold: float
    ks_threshold: float
    calibration_draws: int
    calibration_windows: int
    block_size: int
    calibration_alarm_rate: float

def calibrate_false_alarm_budget(
    reference: Batch,
    stable_history: list[Batch],
    monthly_budget: float = .10,
    draws: int = 500,
    block_size: int = 3,
    seed: int = 13,
) -> AlarmBudget:
    """Calibrate joint monthly PSI/KS warnings with moving-block resampling."""
    if not 0 < monthly_budget < 1:
        raise ValueError("monthly_budget must be between 0 and 1")
    if draws < 100:
        raise ValueError("draws must be at least 100")
    if len(stable_history) < 20:
        raise ValueError("at least 20 stable historical windows are required")
    if not 1 <= block_size <= len(stable_history):
        raise ValueError("block_size must fit the stable history")
    if any(set(batch.features)!=set(reference.features) for batch in stable_history):
        raise ValueError("stable history feature schema mismatch")
    psi_maxima=[
        max(psi(reference.features[name],batch.features[name]) for name in reference.features)
        for batch in stable_history
    ]
    ks_maxima=[
        max(ks(reference.features[name],batch.features[name]) for name in reference.features)
        for batch in stable_history
    ]
    # Split the family budget across PSI and KS (Bonferroni). Moving blocks
    # preserve short-range correlation between adjacent monthly windows.
    tail=monthly_budget/2
    window_count=len(stable_history)
    quantile_index=min(window_count-1,int((1-tail)*window_count))
    rng=Random(seed); psi_quantiles=[]; ks_quantiles=[]
    for _ in range(draws):
        indices=[]
        while len(indices)<window_count:
            start=rng.randrange(window_count)
            indices.extend((start+offset)%window_count for offset in range(block_size))
        indices=indices[:window_count]
        psi_quantiles.append(sorted(psi_maxima[i] for i in indices)[quantile_index])
        ks_quantiles.append(sorted(ks_maxima[i] for i in indices)[quantile_index])
    # A 95th-percentile bootstrap quantile is intentionally conservative.
    confidence_index=min(draws-1,int(.95*draws))
    psi_threshold=sorted(psi_quantiles)[confidence_index]+1e-12
    ks_threshold=sorted(ks_quantiles)[confidence_index]+1e-12
    rate=mean(p>=psi_threshold or k>=ks_threshold for p,k in zip(psi_maxima,ks_maxima))
    return AlarmBudget(
        _reference_fingerprint(reference),monthly_budget,psi_threshold,ks_threshold,
        draws,window_count,block_size,round(rate,6),
    )

@dataclass(frozen=True)
class Finding:
    feature: str
    psi: float
    ks: float

@dataclass(frozen=True)
class Decision:
    month: str
    findings: tuple[Finding, ...]
    mature_labels: int
    immature_labels: int
    mae: float | None
    baseline_mae: float | None
    performance_drop: float | None
    action: str
    reason: str
    estimated_cost: float

    def issue_body(self) -> str:
        moved=", ".join(f"{f.feature} (PSI {f.psi:.3f}, KS {f.ks:.3f})" for f in self.findings) or "none"
        perf="unavailable" if self.performance_drop is None else f"{self.performance_drop:.3f}"
        return (f"## Drift decision: {self.month}\n\n**Action:** {self.action}\n\n"
                f"**Evidence:** moved features: {moved}; mature labels: {self.mature_labels}; "
                f"immature labels: {self.immature_labels}; MAE increase: {perf}.\n\n"
                f"**Rationale:** {self.reason}\n\n**Estimated retraining cost:** ${self.estimated_cost:.2f}\n")

class DriftMonitor:
    def __init__(
        self,
        reference: Batch,
        policy: TicketPolicy = TicketPolicy(),
        alarm_budget: AlarmBudget | None = None,
    ) -> None:
        self.reference, self.policy = reference, policy
        if alarm_budget is not None and alarm_budget.reference_fingerprint != _reference_fingerprint(reference):
            raise ValueError("alarm budget was calibrated for a different reference")
        self.alarm_budget=alarm_budget
        mature = self._mature_pairs(reference)
        if len(mature) < policy.min_mature_labels: raise ValueError("reference lacks mature labels")
        self.baseline_mae = mean(abs(p-o) for p,o in mature)

    def _mature_pairs(self, batch: Batch) -> list[tuple[float,float]]:
        return [(p,float(o)) for p,o,age in zip(batch.predictions,batch.outcomes,batch.outcome_ages_days)
                if o is not None and age >= self.policy.maturity_days]

    def analyze(self, batch: Batch) -> Decision:
        if set(batch.features) != set(self.reference.features): raise ValueError("feature schema mismatch")
        findings=tuple(sorted((Finding(name,psi(self.reference.features[name], vals),ks(self.reference.features[name], vals))
                               for name,vals in batch.features.items()), key=lambda x:max(x.psi,x.ks), reverse=True))
        psi_threshold=self.alarm_budget.psi_threshold if self.alarm_budget else self.policy.psi_warning
        ks_threshold=self.alarm_budget.ks_threshold if self.alarm_budget else self.policy.ks_warning
        moved=tuple(f for f in findings if f.psi>=psi_threshold or f.ks>=ks_threshold)
        mature=self._mature_pairs(batch)
        labelled=sum(o is not None for o in batch.outcomes)
        current_mae=mean(abs(p-o) for p,o in mature) if mature else None
        drop=None if current_mae is None else current_mae-self.baseline_mae
        cost=self.policy.training_hours*self.policy.hourly_compute_cost+self.policy.engineer_hours*self.policy.hourly_engineer_cost
        if len(mature) < self.policy.min_mature_labels:
            action="WAIT_FOR_LABELS"
            reason="Feature drift is an early warning, but equally mature outcome evidence is insufficient."
        elif drop is not None and drop >= self.policy.mae_drop:
            action="OPEN_RETRAIN_TICKET"
            cause=moved[0].feature if moved else "unobserved factors"
            reason=f"Performance deteriorated on mature cohorts; strongest observed shift is {cause}."
        elif moved:
            action="MONITOR"
            reason="Inputs moved but mature-cohort performance remains within budget."
        else:
            action="NO_ACTION"
            reason="Neither feature drift nor mature-cohort performance crossed policy thresholds."
        return Decision(batch.month,moved,len(mature),labelled-len(mature),current_mae,self.baseline_mae,drop,action,reason,cost)

def alert_lead_month(decisions: Iterable[Decision]) -> int | None:
    rows=list(decisions)
    warning=next((i for i,d in enumerate(rows) if d.findings),None)
    decay=next((i for i,d in enumerate(rows) if d.action=="OPEN_RETRAIN_TICKET"),None)
    return None if warning is None or decay is None else decay-warning

