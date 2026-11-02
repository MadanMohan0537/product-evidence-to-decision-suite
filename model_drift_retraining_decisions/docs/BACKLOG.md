# Feature backlog

| Priority | Feature | User problem | Behavior | Dependencies | Success test | Risks / tradeoffs | Status |
|---|---|---|---|---|---|---|---|
| P0 | Drift-to-decision workflow | Owners discover decay too late | Rank PSI/KS evidence, gate on performance, cost a ticket | Python stdlib | Seeded decay opens one evidence-backed decision | Fixed thresholds need calibration | Shipped |
| P1 | Delayed-label attribution | Missing labels resemble deterioration | Compare only equally mature cohorts and expose maturity counts | Outcome timestamps | Zero performance tickets below 30 mature labels | Delay may be outcome-dependent | Shipped |
| P1 | False-alarm budget | Many correlated features create alert noise | Bind deterministic moving-block bootstrap thresholds to reference history and cap joint PSI/KS warnings | 60 stable historical windows | 19/200 held-out stable windows warn (9.5%) under a 10% budget; seeded shift still warns | Unrepresentative history or conservative thresholds can hide rare shifts | **Shipped** |
| P1 | Decision follow-through | Tickets do not prove retraining helped | Track accept/defer/reject and post-retrain impact | Ticket state, outcome metrics | Every ticket has disposition and measured result | Attribution confounded by other changes | Planned |
| P2 | Sensor fault versus behavior shift | Broken pipelines trigger needless retraining | Rank freshness, missingness, range, and contract evidence before retrain | Data contracts, freshness telemetry | Seeded faults recommend repair, not retraining | Fault and behavior shift can coexist | Planned |
| P2 | Champion-challenger gate | Retraining can make performance worse | Train candidate and promote only on temporal holdout | Training pipeline, artifact registry | Inferior challenger cannot ship | Extra compute and operational complexity | Explored |
| P2 | Outcome-delay selection audit | Mature labels may not represent all predictions | Model maturity probability and report weighted sensitivity | Cohort covariates | Seeded informative delay is detected | Weighting increases variance | Explored |
| P3 | Drift budget portfolio | Teams cannot compare urgency across models | Allocate alert/retrain budget by impact and uncertainty | Model registry, business value | Highest expected-loss model ranks first | Monetary estimates can dominate safety concerns | Explored |
| P3 | Counterfactual cause probes | Ranked correlations are mistaken for causes | Replay predictions while perturbing one plausible driver | Feature transformation rules | Known synthetic driver ranks above correlates | Unrealistic perturbations mislead | Explored |
| P3 | Ticket deduplication and cooldown | One incident creates repeated monthly tickets | Merge windows into an incident with recovery criteria | Durable incident state | Sustained shift produces one active ticket | Can hide distinct concurrent failures | Explored |

## Newly evaluated extensions

| Priority | Feature | User problem | Behavior | Dependencies | Success test | Risks / tradeoffs | Status |
|---|---|---|---|---|---|---|---|
| P1 | Calibration contamination check | A quiet historical period may already contain faults or regime changes | Score window influence and hold calibration when one window dominates the threshold | Historical-window diagnostics | Seeded contaminated month is identified before threshold publication | Removing legitimate extremes can make alerts too sensitive | Planned |
| P2 | Budgeted alert portfolio | Separate models can each meet their own budget while overwhelming one team | Allocate and report a shared review-capacity budget across models | Model registry, ownership, review costs | Synthetic portfolio stays within declared monthly review capacity | High-impact rare risks may be deprioritized | Planned |
| P2 | Threshold aging | Old calibration stops matching seasonality and product mix | Expire thresholds on age, schema change, or stable-distribution drift | Calibration registry, clock | Stale threshold fixture produces a recalibration hold | Frequent recalibration can normalize gradual decay | Planned |

Next slice: decision follow-through, so every ticket records accept/defer/reject and measured post-retrain impact. The rigorous sensor-fault-versus-behavior-shift extension remains the next causal triage feature.
