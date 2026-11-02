# SynthSeal

<!-- catalog:io:start -->
**Input → output:** a synthetic table and a real holdout → fidelity, utility, privacy, and a data card

**Quick start:** `cd synthetic_data_release_audit && PYTHONPATH=. python -m unittest discover -s tests -v`

**Track:** Data analytics · Advanced · built
<!-- catalog:io:end -->


[![CI](https://github.com/MadanMohan0537/synthetic-data-release-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/MadanMohan0537/synthetic-data-release-audit/actions/workflows/ci.yml)

SynthSeal packages a synthetic table with the evidence needed to judge it: distribution fidelity, train-on-synthetic/test-on-real utility, nearest-neighbor privacy risk, a rare-record disclosure challenge, and a plain-language data card.

> **Project Lab traceability:** Idea 14 — Privacy-Safe Synthetic Data Studio. SynthSeal is the product name; the original title is retained only as metadata.

## The concrete problem

Synthetic data is not safe merely because it is artificial. A generator can reproduce a rare source row while aggregate metrics still look healthy. Conversely, aggressive privacy remediation can destroy downstream utility. SynthSeal reports both dimensions and blocks the tempting shortcut of presenting one score as proof.

## Shipped MVP

- Deterministic Adult-shaped public-data fixture containing no real people
- Conditional Gaussian sampler for numeric columns and grouped categorical sampling
- Per-column aggregate distribution gap
- Nearest-centroid train-on-synthetic/test-on-real benchmark
- Normalized nearest-neighbor and membership-threshold privacy metrics
- Release packager producing CSV, JSON evidence, and a data card
- **P1 rare-record disclosure challenge:** audits low-frequency combinations separately
- **P1 attack ensemble:** rare-copy, membership-inference AUC, and sensitive-attribute inference with explicit denominators and limits
- Release recommendation derived from independent attack flags rather than one privacy score
- Seeded copied-outlier experiment and deterministic removal remediation
- 27 focused tests and Python 3.11–3.13 CI

No credentials, external services, models, or network access are required.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
python -m synthseal.cli --output release
```

The release directory contains:

- `synthetic.csv` — remediated synthetic table
- `report.json` — utility and privacy evidence before and after remediation
- `DATA_CARD.md` — intended use, metrics, and prohibitions

## Rare-record experiment

The frozen fixture contains exactly one rare Graduate/Remote/high-income combination. The experiment intentionally appends an exact synthetic copy, audits rare keys separately, and removes exposed rows. Acceptance criteria are set before execution:

- detect the copied rare row;
- retain zero known rare exposures after remediation;
- keep the absolute TSTR utility gap below 0.25;
- report denominators rather than claiming formal privacy.

## Attack-ensemble experiment

The seeded release is evaluated by three attacker views. Before remediation, the rare-copy challenge flags one exposure, membership-inference AUC is 0.5479 against a 0.65 limit, and attribute-inference advantage is 0.0589 against a 0.15 limit. The release is blocked because one attack succeeds. After the exposed row is removed, there are zero attack flags, membership AUC falls to 0.5423, attribute advantage is 0.0556, and the TSTR utility gap remains −0.0333.

## Architecture

```text
source rows -> conditional sampler -> synthetic candidate
                                    -> utility suite
                                    -> privacy suite -> rare challenge -> remediation
                                                        -> release package
```

## Evidence boundaries

This is a portfolio-scale evaluation workflow, not a privacy guarantee. The fixture is synthetic; membership AUC is an optimistic distance attack rather than a calibrated production adversary; attribute inference uses one nearest-neighbor strategy; categorical distance is hand-designed; and the generator does not provide differential privacy. Real releases require legal review, access controls, protected evaluation data, stronger attacks, purpose-specific models, and explicit privacy budgets. See [method and limitations](docs/METHOD.md), [feature backlog](docs/BACKLOG.md), and [rotation progress](docs/PROGRESS.md).

<!-- catalog:connects:start -->
## How this connects

**Input → output:** a synthetic table and a real holdout → fidelity, utility, privacy, and a data card

**Upstream:** None in this catalog.

**Downstream:** [DriftDocket](../model_drift_retraining_decisions/README.md)

**Related:** None in this catalog.

**Track:** Data analytics · Advanced.

**Project 7:** Not imported by the Project 7 Worker. Links in this section are intended portfolio handoffs, not runtime imports.
<!-- catalog:connects:end -->
