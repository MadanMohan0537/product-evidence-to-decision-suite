# Method and limitations

## Reproducible study

The CLI generates twelve monthly batches of 120 demand observations. Later months receive a temperature/promotion distribution shift; the final labelled months also receive a seeded prediction-error increase. The last month has delayed outcomes. The same random seeds always recreate the study.

Predeclared thresholds are PSI 0.20, KS 0.25, MAE increase 0.12, at least 30 labels, and outcome age of at least 30 days. The monitor reports the number of months between the first feature warning and first confirmed performance-decay ticket.

## P1 delayed-label attribution

Only predictions whose outcomes both exist and reach the same maturity horizon enter performance comparisons. A seeded incomplete cohort must not produce `OPEN_RETRAIN_TICKET`. This prevents the specific false alert caused by missing labels; it does not remove outcome-dependent selection bias among labels that do mature.

## P1 false-alarm budget

Fixed per-feature thresholds are replaced by an optional calibration bound to the exact reference fingerprint. Sixty stable historical windows are scored by their maximum PSI and maximum KS across features. A moving-block bootstrap resamples three adjacent windows at a time, preserving short-range monthly dependence. The 10% family budget is split equally across PSI and KS, and conservative upper bootstrap quantiles become the warning thresholds.

The predeclared acceptance test uses 800 deterministic bootstrap draws and 200 independent stable windows. The held-out warning rate must not exceed 12% around the 10% target; the observed result is 19/200 (9.5%). A separate seeded shift must still warn. This bounds one frozen synthetic study, not all future false-alarm rates.

## Limitations

- Synthetic results establish code behavior, not real-world model quality.
- Feature association is not causal attribution.
- PSI depends on bins and reference choice; KS sensitivity scales with sample size.
- The family budget covers the maximum feature statistic for PSI and KS, but does not protect against repeatedly recalibrating until a preferred threshold appears.
- Historical stability is assumed; contaminated or unrepresentative calibration windows can hide real drift or inflate alerts.
- Moving blocks preserve only short-range dependence selected by the configured block size.
- MAE is the only performance metric.
- Cost uses configured hours and rates, not cloud billing.
- There is no persistent scheduler, dashboard, authenticated GitHub write, or champion-challenger training job.
- Outcome delay may be informative; equally mature cohorts can still differ systematically.
