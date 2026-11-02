# Project 34 — Product Planning Policy Change & Version Controller

<!-- catalog:io:start -->
**Input → output:** an adoption decision → a versioned policy-change readiness result

**Quick start:** `cd planning_policy_change_controller && npm install && npm run check`

**Track:** PM · Advanced · built
<!-- catalog:io:end -->


Project 34 turns a Project 33 `verified_adopt` outcome into a **controlled, versioned, and reversible change proposal**. It closes the gap between “the trial met its declared conditions” and “the organization is ready to adopt the policy safely.”

## What it verifies

- The referenced Project 33 decision is genuinely `verified_adopt`.
- `fromVersion` matches the active policy and `toVersion` advances it.
- Scope is explicit and cannot exceed the active policy population.
- Rollout begins with a limited cohort and progresses to 100%.
- At least two bounded monitors exist.
- Rollback restores the active version and names monitor triggers.
- Training and communication evidence exists.
- Product, Operations, and Governance approvals are independent.

The resulting state is `ready_to_activate`, `blocked_activation`, or `action_required`. Readiness is evidence for a human change process—not execution authority.

## Product boundary

The controller never activates a policy, changes team assignments, edits estimates, distributes communications, evaluates employees, or performs rollback. It makes prerequisites and missing controls visible.

## Run and deploy

```bash
npm test
npx wrangler dev
npx wrangler secret put API_TOKEN
npx wrangler deploy
```

Send authenticated JSON to `POST /api/planning-policy-changes`. The body contains `runs`, a Project 33 `outcomeReport`, and `input` with active policies and proposals. The API token is a Worker secret and is never committed.

## Architecture

- Dependency-free deterministic engine
- Authenticated Cloudflare Worker with same-origin enforcement
- Streaming 2 MB request limit and structured errors
- Responsive browser interface with system-aware light/dark themes
- No paid APIs, hosted models, cookies, telemetry, or runtime packages

See [product requirements](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), and [metrics](docs/METRICS.md).

## Research basis

NIST configuration change control motivates reviewed, documented, monitored, tested, and reversible changes. Google SRE guidance supports gradual rollout, monitoring, and early rollback. GAO evidence-based policymaking guidance supports retaining the evidence behind implementation decisions. These sources inform the design; they do not certify the software.

## License

MIT

<!-- catalog:connects:start -->
## How this connects

**Input → output:** an adoption decision → a versioned policy-change readiness result

**Upstream:** [Product Planning Policy Experiment Outcome Verifier](../planning_policy_outcome_verifier/README.md)

**Downstream:** [Product Planning Policy Rollout Assurance Monitor](../planning_policy_rollout_monitor/README.md)

**Related:** None in this catalog.

**Track:** PM · Advanced.

**Project 7:** Imported by the [Experiment & Learning Workspace](../experiment-data-quality-auditor/README.md).
<!-- catalog:connects:end -->
