# Product Strategy

## Positioning

Autonomous Product Analyst sits between a dashboard and a general-purpose text-to-SQL assistant. Dashboards show what changed. Text-to-SQL tools answer one query. This product executes a governed investigation: it compares periods, checks a fixed hypothesis space, ranks contributors, quantifies statistical evidence, correlates releases, and recommends what to inspect next.

## Wedge

Start with activation investigations on product-event data. Activation is frequent, strategically important, explainable through funnels and dimensions, and well suited to controlled synthetic benchmarks.

## Differentiation

- Governed metric definitions instead of invented SQL semantics
- Multi-query investigation instead of a single generated query
- Read-only validation and bounded execution
- Transparent contributor ranking and uncertainty
- Release context without causal overclaiming
- Deterministic operation without a paid LLM
- Evaluation against planted and analyst-labeled incidents

## Adoption path

1. **Local synthetic demo:** prove the workflow and trust model.
2. **Read-only extract:** analyze anonymized CSV, Parquet, or DuckDB data.
3. **Warehouse pilot:** support one narrowly scoped read-only connector.
4. **Team workflow:** saved investigations, review, comments, and alert handoff.
5. **Narration layer:** optional LLM rewrites computed facts under a strict evidence contract.

## Build-versus-buy rule

Do not add LangGraph, an LLM provider, or distributed infrastructure until the workflow requires non-deterministic planning that cannot be expressed as a tested analysis graph. The MVP's finite hypothesis space is clearer, cheaper, and safer as normal code.

## Risks

- Instrumentation changes can resemble product changes.
- High-cardinality slices create multiple-comparison risk.
- Simpson's paradox can make one-dimensional explanations misleading.
- Releases correlated in time may not cause the change.
- Small groups can expose sensitive behavior.

Mitigations include instrumentation checks, sample thresholds, multiple-testing controls, intersection analysis, evidence traces, privacy review, and required human confirmation before decisions.
