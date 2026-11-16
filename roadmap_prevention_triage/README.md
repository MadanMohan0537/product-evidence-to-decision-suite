# Project 64: Roadmap Prevention Review Queue

[Project 63](../roadmap_prevention_evidence_comparison/) tells you what changed. Project 64 tells you what to review first. It groups outstanding prevention checks by control, includes unchanged failures, and removes checks that are now current. The design draws on [Google SRE's alerting guidance](https://sre.google/workbook/alerting-on-slos/) for actionable signals; this is not an SLO alerting implementation.

## Use it

In Project 7, select **Prioritize prevention follow-up** and upload the [Project 63 comparison request](../roadmap_prevention_evidence_comparison/README.md), or POST it to authenticated `/api/prevention-triage`. The body accepts `previous` and `latest`, each containing a Project 61 `envelope` and separately trusted `expectedDigest`. An optional integer `limit` (1–100, default 20) caps the number of control groups.

The Cloudflare Worker verifies both digests and compares like-for-like snapshots through Project 63 before running the deterministic triage engine. Groups are ordered by their most urgent outstanding check: failed first, then missing, then stale, with control ID as the tie-breaker. Each action includes its latest status, transition, and suggested next step. The response reports omitted groups when the limit is reached.

## Limits and tests

Priority expresses what evidence to review first, not business impact or incident severity. The module does not send alerts, assign tasks, persist a queue, or change state. It uses the existing Worker and needs no paid service or new runtime dependency.

Run `npm test` in this folder or `node experiment-data-quality-auditor/scripts/test-all.mjs` at the repository root.
