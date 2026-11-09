# Configuration Drift Remediation & Recovery Verifier

Project 57 connects [Project 56 drift detection](../roadmap_recalibration_baseline_drift_monitor/) to a read-only recovery evidence review.

## Current implementation

- Deterministic, zero-dependency recovery evidence reconciliation
- Exact handoff, active-version, and factor-manifest identity checks
- Chronological follow-up enforcement
- Unique, owned, evidence-linked corrective actions
- Authenticated Cloudflare Worker API with same-origin enforcement
- Streamed 2 MB request limit

The verifier never performs remediation, changes configuration, or closes an incident. Its current `recovery_evidence_complete` result is only a completeness check, not an authorized human closure.

## API

`POST /api/configuration-recovery` requires `Authorization: Bearer <API_TOKEN>` and `Content-Type: application/json`.

The request contains:

- `source`: original Project 56 report containing failed checks
- `followup`: later Project 56 report on the same handoff, version, and manifest
- `actions`: corrective actions containing `id`, `controlId`, `owner`, `evidence`, and `status`. Completed actions also need `approvedBy`, `approvedAt`, and `completedAt`.
- `review`: `reviewer`, `reviewedAt`, and `decision: "accept_evidence"` for independent acceptance.

Returns `recovery_evidence_complete` only when all follow-up checks pass, each original failure has one independently approved completed action, two aligned snapshots after the last completion span at least one hour, and an independent reviewer accepts the evidence after the follow-up. Otherwise returns `recovery_incomplete`; malformed input or invalid lineage is rejected. Use timezone-qualified ISO timestamps.

In [Project 7](../experiment-data-quality-auditor/), use the same route but send `sourceAssessment` and `followupAssessment` (the original Project 56 request bodies) instead of `source` and `followup`. The connected Worker reconstructs both reports from these inputs and the workspace runs. The standalone Worker checks supplied reports, not their authenticity. Both modes rely on operator-supplied evidence and identities.

## Development

```bash
cd roadmap_configuration_recovery
npm test
# Set API_TOKEN in an ignored .dev.vars file for local use.
npx wrangler dev
```

No paid service or runtime dependency is required. Cloudflare account quotas still apply.

Open the local Worker URL to upload a standalone request as JSON. For a deployment, configure the token with `npx wrangler secret put API_TOKEN`. To run the connected integration and all module tests, use `node experiment-data-quality-auditor/scripts/test-all.mjs` from the repository root.

## Research basis

[NIST SP 800-128](https://doi.org/10.6028/NIST.SP.800-128) informs reconciliation of detected configuration changes with approved changes and remediation records. [NIST SP 800-61 Rev. 3](https://doi.org/10.6028/NIST.SP.800-61r3) informs the separation between recovery evidence and incident response decisions. The one-hour window is a ProdMind rule, not a NIST requirement. This implementation does not claim compliance.
