# Project 36 — Product Planning Policy Effectiveness & Drift Monitor

<!-- catalog:io:start -->
**Input → output:** longitudinal observations → effectiveness and drift findings

**Quick start:** `cd planning_policy_effectiveness_monitor && npm install && npm run check`

**Track:** PM · Advanced · built
<!-- catalog:io:end -->


Project 36 verifies whether a fully deployed planning policy continues to deliver its predeclared outcome without violating its guardrail.

## Why it exists

Project 35 proves rollout conformance: the right version reached the approved stages, observed the required dwell, and stayed within rollout monitors. That is necessary, but it does not show that the policy remains useful after full exposure. Project 36 closes that gap with longitudinal outcome assurance.

## What it checks

- Project 35 verified the rollout and its human `continue` decision.
- Project 33 adoption and Project 32 experiment lineage remain resolvable.
- Primary targets, guardrails, and sample requirements come from the predeclared experiment.
- Multiple observations follow rollout completion in chronological order.
- The minimum sustainment window and maximum observation cadence are satisfied.
- Every observation uses the approved policy version and sufficient sample.
- Primary and guardrail performance remain inside their declared bounds.
- Every observation retains reviewable evidence.
- A named human selects `retain`, `adjust`, or `revert`.

A passing `retain` review becomes `sustained_effectiveness`. A failed prerequisite produces `blocked_retain`; `adjust` and `revert` remain `action_required`. The engine reports drift but does not claim the policy caused the observed outcome.

## Run and deploy

```bash
npm test
npx wrangler dev
npx wrangler secret put API_TOKEN
npx wrangler deploy
```

Send authenticated JSON to `POST /api/planning-policy-effectiveness` with `runs`, the Project 35 `rolloutReport`, Project 32 `policyPlan`, Project 33 `outcomeReport`, and review `input`.

## Architecture and boundaries

- Maintainable dependency-free deterministic engine
- Authenticated Cloudflare Worker with a 2 MB streaming limit
- Same-origin API enforcement and restrictive security headers
- Responsive system-aware light/dark interface
- No paid APIs, hosted models, analytics, or runtime dependencies
- Never retains, adjusts, or reverts a policy
- Never turns descriptive outcome continuity into a causal claim

See the [PRD](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), and [metrics](docs/METRICS.md).

## Research basis

NIST SP 800-137 motivates ongoing assessment of control effectiveness as operating conditions change. NIST SP 800-137A motivates evaluating the completeness and effectiveness of a monitoring program using its continuous-monitoring data. These sources inform the assurance model; they do not certify this implementation.

## License

MIT

<!-- catalog:connects:start -->
## How this connects

**Input → output:** longitudinal observations → effectiveness and drift findings

**Upstream:** [Product Planning Policy Rollout Assurance Monitor](../planning_policy_rollout_monitor/README.md)

**Downstream:** [Product Planning Policy Reversion & Recovery Verifier](../planning_policy_recovery_verifier/README.md)

**Related:** None in this catalog.

**Track:** PM · Advanced.

**Project 7:** Imported by the [Experiment & Learning Workspace](../experiment-data-quality-auditor/README.md).
<!-- catalog:connects:end -->
