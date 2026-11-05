# Configuration Drift Remediation & Recovery Verifier

Project 57 is **under development**. It consumes before-and-after Project 56 monitoring reports and checks whether originally failed controls have both completed remediation evidence and passing follow-up controls.

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
- `actions`: corrective actions containing `id`, `controlId`, `owner`, `evidence`, and `status`

Returns `recovery_evidence_complete` only when every original failed check has a completed action and a passing follow-up check, and all supplied follow-up checks pass. Otherwise returns `recovery_incomplete`. Invalid lineage or malformed input is rejected.

## Development

```bash
cd roadmap_configuration_recovery
npm test
npx wrangler secret put API_TOKEN
npx wrangler dev
```

No paid service or runtime dependency is required. Cloudflare account quotas still apply.

## Remaining release gates

Do not treat this module as production-ready yet. It still needs authoritative server-side Project 56 reconstruction, stricter report validation, approved action timing, a stable observation window, independent human review, a frontend, integrated workflow tests, and inclusion in the root catalog and full-suite CI.

## Research basis

[NIST SP 800-128](https://doi.org/10.6028/NIST.SP.800-128) informs reconciliation of detected configuration changes with approved changes and remediation records. This implementation does not claim NIST compliance.
