"""Deterministic multi-dimensional root-cause investigation."""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta

from .metrics import DIMENSIONS, get_metric
from .sql_guard import metric_sql


@dataclass
class PeriodResult:
    numerator: int
    denominator: int
    rate: float


def _period(row: dict | None) -> PeriodResult:
    row = row or {}
    numerator = int(row.get("numerator") or 0)
    denominator = int(row.get("denominator") or 0)
    return PeriodResult(numerator, denominator, numerator / denominator if denominator else 0.0)


def _parse_day(value: str | date) -> date:
    return value if isinstance(value, date) else datetime.strptime(value, "%Y-%m-%d").date()


def _significance(current: PeriodResult, previous: PeriodResult) -> float:
    if not current.denominator or not previous.denominator:
        return 0.0
    pooled = (current.numerator + previous.numerator) / (current.denominator + previous.denominator)
    error = math.sqrt(max(pooled * (1 - pooled) * (1 / current.denominator + 1 / previous.denominator), 0))
    return abs(current.rate - previous.rate) / error if error else 0.0


def investigate(database, metric_name: str = "activation", end: str | None = None, window_days: int = 7) -> dict:
    metric = get_metric(metric_name)
    end_day = _parse_day(end or date.today().isoformat())
    current_start = end_day - timedelta(days=window_days)
    previous_start = current_start - timedelta(days=window_days)

    def run(start: date, finish: date, dimension: str | None = None):
        sql, params = metric_sql(metric, start.isoformat(), finish.isoformat(), dimension)
        return database.query(sql, params)

    current = _period((run(current_start, end_day) or [{}])[0])
    previous = _period((run(previous_start, current_start) or [{}])[0])
    overall_delta = current.rate - previous.rate
    investigations = []

    for dimension in DIMENSIONS:
        current_rows = {row.get("dimension_value"): _period(row) for row in run(current_start, end_day, dimension)}
        previous_rows = {row.get("dimension_value"): _period(row) for row in run(previous_start, current_start, dimension)}
        for value in sorted(set(current_rows) | set(previous_rows), key=lambda item: str(item)):
            now = current_rows.get(value, PeriodResult(0, 0, 0))
            before = previous_rows.get(value, PeriodResult(0, 0, 0))
            delta = now.rate - before.rate
            current_share = now.denominator / current.denominator if current.denominator else 0
            contribution = delta * current_share
            investigations.append({
                "dimension": dimension,
                "value": value or "unknown",
                "current": asdict(now),
                "previous": asdict(before),
                "delta": round(delta, 4),
                "contribution": round(contribution, 4),
                "z_score": round(_significance(now, before), 3),
                "sample_size": now.denominator + before.denominator,
            })

    investigations.sort(key=lambda row: (row["contribution"], -row["sample_size"]))
    contributors = [row for row in investigations if row["delta"] < 0][:10] if overall_delta < 0 else sorted(investigations, key=lambda row: row["contribution"], reverse=True)[:10]
    top = contributors[0] if contributors else None
    releases = database.query(
        "SELECT version, released_at, notes FROM releases WHERE released_at >= ? AND released_at < ? ORDER BY released_at DESC",
        (previous_start.isoformat(), end_day.isoformat()),
    )
    return {
        "metric": metric.to_dict(),
        "periods": {
            "current": {"start": current_start.isoformat(), "end": end_day.isoformat(), **asdict(current)},
            "previous": {"start": previous_start.isoformat(), "end": current_start.isoformat(), **asdict(previous)},
        },
        "delta": round(overall_delta, 4),
        "relative_delta": round(overall_delta / previous.rate, 4) if previous.rate else None,
        "overall_z_score": round(_significance(current, previous), 3),
        "primary_contributor": top,
        "contributors": contributors,
        "releases": releases,
        "dimensions_investigated": list(DIMENSIONS),
    }
