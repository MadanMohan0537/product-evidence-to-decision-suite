# Method and limitations

## Study design

The deterministic fixture has 240 Adult-shaped rows and one intentionally rare combination. Training uses 179 ordinary rows plus the rare source row; a disjoint 60-row real holdout supports utility evaluation. Utility compares a nearest-centroid classifier trained on real data with the same classifier trained on synthetic data and tested on that untouched holdout.

Privacy evidence reports normalized nearest-real-record distance and the share of synthetic rows below a 0.02 attack threshold. The P1 challenge separately selects combinations occurring at most twice, inserts an exact rare copy, and verifies detection and removal.

## P1 attack ensemble

Three independent checks are reported with denominators and predeclared limits:

- rare-record copying blocks on any exposed rare combination;
- membership inference compares each known training member and held-out nonmember by its nearest released-row distance, reporting pairwise ROC AUC and flagging at 0.65;
- attribute inference predicts the target from age, hours, education, and region using the nearest released row, then reports advantage over the released table's majority-class baseline and flags at 0.15.

In the frozen experiment, the rare-copy attack is the only pre-remediation flag. Removing that row changes the recommendation from `BLOCK_FOR_PRIVACY_REVIEW` to `NO_ATTACK_EXCEEDED_LIMIT`; membership AUC moves from 0.5479 to 0.5423 and attribute advantage from 0.0589 to 0.0556. A fully memorized training table separately produces membership AUC 1.0.

## What the results mean

A small utility gap supports only this task and fixture. A low observed attack rate means this particular attack did not succeed often; it does not prove anonymity, differential privacy, or resistance to stronger adversaries.

## Limitations

- Data is synthetic and Adult-shaped, not a redistributed public dataset.
- The conditional sampler does not preserve all correlations.
- The classifier is not representative of every downstream use.
- Euclidean/categorical distance embeds subjective weights.
- The membership attacker selects no operating threshold and AUC can hide risk concentrated in a few records.
- Attribute inference evaluates one sensitive field and one nearest-neighbor attacker; low advantage does not rule out stronger auxiliary-data attacks.
- Attack limits are workflow decisions for this fixture, not formal privacy guarantees.
- Rare-key definitions depend on selected quasi-identifiers.
- Removing exposures can alter subgroup representation.
- No differential privacy, CTGAN, relational synthesis, UI, or access-control layer is implemented.
- Evaluation data would require protection in a real workflow.
