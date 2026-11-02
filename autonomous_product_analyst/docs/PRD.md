# Product Requirements Document

## Product

Autonomous Product Analyst helps a product manager investigate changes in governed product metrics without manually writing SQL or checking every segment one at a time.

## Problem

Metric investigation is slow and inconsistent. A PM notices a change, waits for analyst capacity, requests cuts by several dimensions, and manually relates the results to product releases. Basic text-to-SQL shortens query writing but does not perform the investigation, rank contributors, quantify uncertainty, or protect metric meaning.

## Users

- Product managers investigating funnel performance
- Product analysts standardizing recurring diagnostic work
- Growth teams monitoring activation, conversion, and retention
- Founders operating without a dedicated analytics team

## MVP jobs

1. Ask why a governed metric changed during a comparison window.
2. Calculate the metric consistently for current and previous periods.
3. Investigate platform, country, user segment, acquisition source, app version, device, feature usage, and onboarding step.
4. Rank segment-level contributors using rate change, population share, and sample size.
5. Show statistical evidence and nearby product releases.
6. Return an understandable answer, recommended follow-up, and causality warning.

## Functional requirements

- Version-controlled metric definitions
- Parameterized analytical SQL
- Read-only query validation and table allowlisting
- Bounded result sets
- Multi-dimensional investigation
- Two-proportion significance statistic
- Release-window correlation
- Evidence-bound explanation
- Deterministic synthetic dataset with planted regression
- API and responsive light/dark interface
- Evaluation against known synthetic ground truth

## Non-goals

- Arbitrary production database access
- Unrestricted LLM-generated SQL execution
- Claiming statistical association proves causation
- Replacing analyst review for high-impact decisions
- Supporting every metric before its definition is governed

## Acceptance criteria

- The seed scenario detects a negative activation change.
- Android is returned as the primary dimension contributor.
- Release 4.18 appears in the comparison context.
- All eight required dimensions are investigated.
- Unsafe or non-read-only SQL is rejected.
- The application runs without a paid model or analytics service.
