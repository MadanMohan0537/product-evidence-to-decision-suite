# Feature backlog

| Priority | Feature | User problem | Behavior | Dependencies | Success test | Risks / tradeoffs | Status |
|---|---|---|---|---|---|---|---|
| P0 | Evidence-backed release | Teams cannot judge safe usefulness | Package table, utility, privacy and data card | Python stdlib | Reproducible release has all artifacts | Simple metrics can be overinterpreted | Shipped |
| P1 | Rare-record disclosure challenge | Average privacy hides copied outliers | Audit rare quasi-identifier combinations and nearest matches | Protected real evaluation set | Seeded rare copy detected and removed; utility stays in budget | Distance is not a privacy guarantee | Shipped |
| P1 | Attack ensemble | One membership threshold misses threats | Combine rare-copy detection, held-out membership AUC, and quasi-identifier attribute inference with explicit limits | Protected member/nonmember split | Rare copy blocks; full memorization yields AUC 1.0; remediation clears all three fixture flags | Attacker knowledge and chosen limits strongly affect results | **Shipped** |
| P1 | Subgroup utility floor | Aggregate utility hides unusable minority slices | Report TSTR metrics with uncertainty per eligible subgroup | Larger holdout, bootstrap | Seeded subgroup collapse blocks release | Small groups yield noisy estimates | Planned |
| P2 | Constraint fidelity report | Plausible marginals can violate business rules | Declare and test cross-column constraints per synthesizer | Constraint DSL | All seeded impossible relationships are caught | Enforcement may distort utility | Planned |
| P2 | Differential-privacy frontier | Teams cannot choose privacy budget rationally | Sweep epsilon and plot attack/utility trade-off | DP synthesizer, accountant | Committee can identify feasible frontier or reject release | Epsilon is difficult to explain; utility may collapse | Explored |
| P2 | Purpose-bound approvals | A safe QA dataset may be unsafe for modeling | Bind release to purpose, fields, recipients, expiry | Identity and approval workflow | Out-of-purpose request cannot reuse approval | Adds governance friction | Explored |
| P3 | Linkage adversary | External datasets can re-identify rare rows | Simulate linkage with auxiliary attributes | Public auxiliary fixture | Seeded linkable records are flagged | Attacker assumptions may be unrealistic | Explored |
| P3 | Remediation portfolio | Row removal is not always best | Compare suppress, generalize, resample and DP noise | Multiple strategies | Pareto report shows privacy/utility changes | More choices can obscure accountability | Explored |
| P3 | Release drift monitor | Source changes make old evidence stale | Fingerprint source/schema and invalidate old reports | Registry, scheduled evaluation | Changed source cannot ship with prior card | Re-evaluation cost | Explored |

## Newly evaluated extensions

| Priority | Feature | User problem | Behavior | Dependencies | Success test | Risks / tradeoffs | Status |
|---|---|---|---|---|---|---|---|
| P1 | Attack calibration registry | Fixed limits can be arbitrary or quietly changed | Version attacker assumptions, limits, calibration fixtures, and reviewer rationale | Immutable evidence manifest | Changing any attack limit invalidates the prior release recommendation | Governance can legitimize weak thresholds | Planned |
| P2 | Worst-record privacy bound | Aggregate AUC hides a few extremely exposed members | Report top-k member risks and tail quantiles beside aggregate attacks | Per-record protected evidence | Seeded single-record exposure appears in the top-risk tail | Per-record reports require strict access control | Planned |
| P2 | Auxiliary-data stress test | Real attackers may know region, education, or age bands | Run bounded knowledge scenarios and compare attack lift | Reviewed auxiliary-data scenarios | Seeded linkage risk rises in the matching scenario | Unrealistic assumptions can overstate harm | Planned |

Next slice: subgroup utility floors, because a globally useful release can still fail minority slices. The rigorous constraint-fidelity report remains the next structural-quality extension.
