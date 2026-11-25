# Project 73: Review Tracking Reference Auditor

Projects 71–72 show declared reviewers and workload counts. This module exposes a remaining ambiguity: several review controls can share a tracking reference, potentially across owners. It flags that relationship for inspection without wrongly rejecting legitimate parent tickets.

## Connected use

Use the existing Project 7 **Monitor escalation responses** form or authenticated `/api/escalation-responses` endpoint, with the existing evidence and optional `reviewAssignments`. No new inputs are required. The response adds `reviewTrackingAudit`, displayed by the existing light/dark JSON result interface.

The Worker reconstructs upstream evidence, response states, review queue and assignments before auditing references. Each shared-reference group retains every control and owner, plus a `crossOwner` flag. `distinctTickets` counts exact case-sensitive tracking labels; `unassigned` remains explicit. Status is `inspect_shared_tracking` or `no_shared_tracking_detected`, neither of which establishes task completion or ticket validity.

## Architecture, requirements and tests

Project 71 validated assignments → dependency-free linear grouping → stable ticket-sorted JSON. Preserve report IDs, observation time and all grouped control records. Do not merge responsibilities, reject intentional parent tickets, mutate input, or fetch external records. Unit tests cover cross-owner sharing, same-owner sharing, missing assignments, empty queues and input immutability.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root. Existing Project 7 Worker deployment, token, D1, origin rules and request limits apply; no migration or separate deployment configuration is needed. No paid API, runtime dependency, messaging or network call is introduced. Free quotas still apply; merging does not deploy.

## Product impact and limits

Proposed measures: shared-reference groups requiring inspection and cross-owner ambiguity count. These are snapshot review signals, not measured duplicate-ticket rates or historical analytics. Reference strings and owners remain human assertions. Different spellings or URL aliases are not canonicalized; identical labels can legitimately refer to one parent task. The module never creates, closes, resolves or verifies tickets and does not infer remediation success.

[Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) emphasizes specific, formally tracked action items. Inspecting ambiguous tracking is this product's design choice, not a Google-prescribed uniqueness rule.
