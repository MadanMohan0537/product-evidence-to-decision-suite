# Method and limitations

ParityProbe uses paired counterfactuals: each candidate is evaluated as written and after one declared semantic attribute changes. Linked fields such as a display name and its synthetic group label change together; all task-relevant qualifications must remain invariant. This isolates treatment within the toy decision rule more directly than comparing unmatched populations.

The report includes flip rate, mean score gap, selection-rate ratio, pair counts, and deterministic nonparametric bootstrap intervals. The four-fifths threshold can be a screening signal in some employment contexts, but it is not a universal legal test and is not automatically applied as a verdict here.

The baseline contains two intentional synthetic effects: a name-group penalty and a regional proxy penalty. The masked model removes the name effect while retaining the proxy effect. This demonstrates why masking one field is not evidence that a system is fair.

P1 validates each counterfactual before metrics are computed. It compares observed and declared edits, blocks changes to invariant qualifications, and checks linked-field consistency. A frozen eight-case fixture contains four valid and four invalid pairs. All four invalid cases must be detected with zero valid-pair rejections.

P2 groups valid pair outcomes by the original record's synthetic name group and region. Every cell reports its pair count, flip count and rate, a two-sided 95% Wilson interval, and the exact gap to a predeclared minimum of 12 pairs. A signal threshold of 20% is descriptive: signals in smaller cells are displayed but explicitly labeled as unsupported. The frozen fixture has a 12-pair no-flip control and a six-pair seeded disparity; the latter must request six additional cases and must not produce a supported conclusion.

Limitations:

- All profiles and demographic labels are synthetic; results say nothing about real people or models.
- Social identity is not reducible to names, gender markers, or geography.
- Counterfactual swaps can erase real social context; every production audit needs domain and community review.
- Bootstrap intervals describe sampling uncertainty in this fixture, not measurement error or legal significance.
- The deterministic decision function is a workflow benchmark, not an LLM evaluation.
- The 12-pair coverage rule is a transparent workflow threshold, not a power analysis; production minimums must follow a predeclared estimand and detectable-effect calculation.
- Wilson intervals describe binomial sampling uncertainty only. They do not correct invalid counterfactuals, selection bias, dependence, or multiple comparisons.
- The current intersection schema is intentionally fixed to two synthetic dimensions; arbitrary dimensions and multiplicity control remain planned.
