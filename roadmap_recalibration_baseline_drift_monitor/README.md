# Roadmap Recalibration Baseline Configuration Drift Monitor

Project 56 continuously checks whether the baseline completed by [Project 55](../roadmap_recalibration_baseline_handoff_controller/) remains one coherent configuration across ProdMind's roadmap-estimation workflow.

## Why this project exists

Project 47 detects **performance drift** in estimation accuracy. Project 56 detects **configuration drift**: a consumer, reference class, version, or control no longer matching the approved Project 55 baseline. Keeping those concerns separate prevents a configuration defect from being mislabeled as a forecasting-quality problem.

The design is informed by NIST SP 800-137 continuous monitoring, NIST SP 800-53 configuration change control, NIST SP 800-128 security-focused configuration management, and Google SRE monitoring and release-engineering practices.

## What it verifies

- Completed Project 55 lineage and human handoff decision
- Minimum chronological snapshots, maximum gaps, and latest-snapshot freshness
- Exact active version and factor-manifest continuity
- Complete, active reference-class registration
- Healthy convergence across all five required consumers
- Available, immutable, sufficiently retained superseded baseline
- Exact, owned, current rollback readiness
- Project 55 effectiveness and drift monitoring ownership and deadlines
- Independent human `retain_baseline`, `remediate_drift`, or `freeze_changes` review

It returns `configuration_stable`, `blocked_retention`, or `action_required`. It never changes configuration, factors, estimates, schedules, consumers, archives, rollback, monitoring, or product state.

## Architecture

```text
Project 55 baseline handoff
           ↓
Versioned configuration snapshots
           ↓
Manifest / class / consumer reconciliation
           ↓
Archive / rollback / monitoring controls
           ↓
Named human decision
```

## Repository layout

```text
src/drift.js       deterministic monitoring engine
src/worker.js      authenticated Cloudflare Worker API
public/            responsive light/dark interface
test/              engine and HTTP boundary tests
docs/              PRD, architecture, and metrics
wrangler.jsonc     Workers configuration
```

## Run locally

```bash
npm test
npm run check
npx wrangler dev
```

Set the secret before deployment:

```bash
npx wrangler secret put API_TOKEN
npx wrangler deploy
```

Send `POST /api/roadmap-recalibration-baseline-drift` with `Authorization: Bearer <token>` and a JSON body containing `handoffReport` and `input`. The public interface uses the same endpoint and keeps the token only in the current page.

## Security and honesty boundaries

- The API fails closed without `API_TOKEN` and uses timing-resistant digest comparison.
- Cross-origin API calls are rejected; the CSP restricts script, style, and network origins.
- Request bodies are limited to 2 MB and error responses do not expose secrets.
- Configuration evidence is reviewed input, not direct observation of external systems.
- Policy thresholds are operational controls, not statistical guarantees.
- No paid API, model, hosted database, or runtime dependency is required.

Apache-2.0 licensed.
