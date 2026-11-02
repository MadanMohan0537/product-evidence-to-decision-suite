"""Governed product metric definitions."""

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Metric:
    name: str
    description: str
    numerator_event: str
    denominator_event: str
    window_days: int = 7

    def to_dict(self) -> dict:
        return asdict(self)


METRICS = {
    "activation": Metric(
        name="activation",
        description="Share of signed-up users who complete onboarding.",
        numerator_event="onboarding_completed",
        denominator_event="signup",
    ),
    "conversion": Metric(
        name="conversion",
        description="Share of signed-up users who start a paid plan.",
        numerator_event="subscription_started",
        denominator_event="signup",
    ),
    "retention": Metric(
        name="retention",
        description="Share of signed-up users who return in the next period.",
        numerator_event="retained",
        denominator_event="signup",
    ),
}


DIMENSIONS = (
    "platform",
    "country",
    "user_segment",
    "acquisition_source",
    "app_version",
    "device",
    "feature_usage",
    "onboarding_step",
)


def get_metric(name: str) -> Metric:
    key = str(name).strip().lower()
    if key not in METRICS:
        raise ValueError(f"unknown metric: {name}")
    return METRICS[key]
