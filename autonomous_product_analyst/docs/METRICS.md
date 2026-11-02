# Product and Model Metrics

## North-star outcome

**Accepted investigations per active product team per month**: investigations reviewed by a PM or analyst and accepted as a useful explanation or next step.

## Quality metrics

| Metric | Definition | MVP target |
|---|---|---:|
| SQL validity | Queries passing the guard and executing successfully | 100% |
| Metric-definition accuracy | Questions resolved to the intended governed metric | ≥95% |
| Root-cause top-1 accuracy | Planted or analyst-labeled cause ranked first | ≥70% |
| Root-cause top-3 recall | Labeled cause appears in first three contributors | ≥90% |
| False-positive rate | Stable periods incorrectly presented as meaningful change | <10% |
| Evidence consistency | Narrative numerical claims match computation | 100% |
| Investigation completion | Requested dimensions successfully evaluated | ≥99% |

## Product metrics

- Median investigation completion time
- Analyst-hours saved per accepted investigation
- Weekly active investigators
- Repeat-question rate
- Follow-up action creation rate
- Percentage of answers opened with evidence details

## Guardrails

- Queries rejected by the SQL guard
- Warehouse scan volume and cost budget
- Low-sample findings shown without a warning
- Unsupported causal language
- Metric-definition overrides outside review
- Sensitive dimensions exposed without authorization

## Evaluation protocol

1. Create synthetic datasets with controlled regressions and null periods.
2. Measure direction, affected dimension/value, ranking, and false alarms.
3. Add anonymized historical incidents labeled independently by two analysts.
4. Report performance by metric, sample size, effect size, and dimension cardinality.
5. Compare with a no-investigation baseline and analyst-authored investigations.
6. Review every narrative claim against the recorded computation.

The two bundled cases verify the harness and planted activation scenario only. They are not a production-accuracy claim.
