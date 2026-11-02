# DriftDocket

<!-- catalog:io:start -->
**Input → output:** feature and mature-label snapshots → drift findings and an evidence-backed retraining ticket

**Quick start:** `cd model_drift_retraining_decisions && PYTHONPATH=. python -m unittest discover -s tests -v`

**Track:** Data analytics · Advanced · built
<!-- catalog:io:end -->


[![CI](https://github.com/MadanMohan0537/model-drift-retraining-decisions/actions/workflows/ci.yml/badge.svg)](https://github.com/MadanMohan0537/model-drift-retraining-decisions/actions/workflows/ci.yml)

DriftDocket turns model drift into an auditable decision: it measures what moved, separates early warnings from confirmed performance decay, estimates retraining cost, and drafts an evidence-backed ticket.

> **Project Lab traceability:** Idea 13 — Drift Monitor and Retraining Ticket. DriftDocket is the product name; the ideation title is retained only as metadata.

## Why this exists

Feature drift is cheap to detect and easy to overreact to. Labels often arrive late, so a naive monitor compares young incomplete cohorts with mature history and mistakes missing outcomes for model decay. DriftDocket only makes performance claims on equally mature outcomes and treats feature drift as an early warning.

## Shipped MVP

- Monthly synthetic demand batches with seasonal and seeded shifts
- Population Stability Index (PSI) and Kolmogorov–Smirnov distance per feature
- Mature-cohort mean absolute error monitoring
- Ranked causal evidence rather than an unsupported single-cause claim
- Four actions: no action, monitor, wait for labels, or open retraining ticket
- Ticket body with evidence, rationale, plan signal, and compute/engineering cost
- Twelve-month JSON report and detection-lead-time metric
- **P1 delayed-label attribution:** incomplete cohorts cannot trigger a performance ticket
- **P1 false-alarm budgeting:** deterministic moving-block bootstrap calibration over historical stable windows
- Joint monthly PSI/KS alarm budget with reference binding and held-out verification
- 28 focused tests and Python 3.11–3.13 CI

No credentials, paid APIs, downloaded models, or network calls are required.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
python -m driftdocket.cli --output drift-report.json
```

## Decision policy

1. Score every feature against the reference distribution using PSI and KS.
2. Track which outcomes exist and which have reached the configured maturity age.
3. Compare MAE only when at least 30 equally mature labels are available.
4. Open a ticket only when mature-cohort error crosses the predeclared budget.
5. Otherwise monitor shifted inputs, wait for labels, or record no action.

Feature movement can precede accuracy decay, creating measurable lead time without claiming every shift requires retraining.

## Delayed-label experiment

The fixture introduces large prediction error while only one-third of outcomes are mature. The naive available-label view is unstable; DriftDocket returns `WAIT_FOR_LABELS` and opens no retraining ticket. Once a sufficiently large mature cohort exhibits the same deterioration, it opens a ticket. The acceptance rule is fixed before evaluation: zero performance tickets below 30 mature labels.

## False-alarm experiment

The monitor calibrates against 60 synthetic stable historical windows using deterministic moving blocks, a 10% monthly family alarm budget, and separate PSI/KS tails. On 200 independently generated held-out stable windows, 19 trigger a warning—a 9.5% rate—while the seeded behavior shift remains detectable. The first row-resampling attempt produced a 62.5% held-out rate and was rejected; only the corrected historical-window design is shipped.

## Architecture

```text
monthly Batch -> PSI/KS findings -> maturity gate -> MAE policy -> Decision
                                                              -> ticket/report
```

## Evidence boundaries

This is a portfolio-scale decision engine, not production monitoring. The dataset is deterministic and synthetic, probable causes are ranked correlations rather than causal proof, and ticket publication is deliberately represented as Markdown instead of mutating an external issue tracker. Bootstrap thresholds depend on representative stable history and are not formal guarantees under future nonstationarity. Production use needs durable storage, data contracts, authentication, real cost telemetry, and monitoring for outcome-dependent label delay. See [method and limitations](docs/METHOD.md), [feature backlog](docs/BACKLOG.md), and [rotation progress](docs/PROGRESS.md).

<!-- catalog:connects:start -->
## How this connects

**Input → output:** feature and mature-label snapshots → drift findings and an evidence-backed retraining ticket

**Upstream:** [SynthSeal](../synthetic_data_release_audit/README.md)

**Downstream:** [ParityProbe](../counterfactual_fairness_audit/README.md)

**Related:** None in this catalog.

**Track:** Data analytics · Advanced.

**Project 7:** Not imported by the Project 7 Worker. Links in this section are intended portfolio handoffs, not runtime imports.
<!-- catalog:connects:end -->
