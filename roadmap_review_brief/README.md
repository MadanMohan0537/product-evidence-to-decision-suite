# Project 75: Communication Review Meeting Brief

Project 74 records review outcomes. This module turns those records into a concise, deterministic meeting agenda while keeping pending work visible and distinguishing communication decisions from actual remediation.

## Connected use

Use Project 7's existing **Monitor escalation responses** form and authenticated `/api/escalation-responses` endpoint. Supply the existing evidence, assignments and optional `reviewDecisions` described in Project 74. No new fields are required. The response adds `reviewBrief`, displayed by the existing light/dark JSON interface.

The brief counts `pending`, `follow_up`, `investigate` and `no_further_communication`. Its agenda includes the first three categories with control ID, owner, ticket, next action, rationale and evidence reference. Missing responsibility remains null rather than being invented. Communication-stop outcomes remain in the counts but leave the agenda. Original report IDs and observation time remain attached. Input order is retained; no new prioritization model is implied.

## Architecture and acceptance criteria

Server-recomputed evidence → response review queue → assignments → dispositions → pure meeting-brief function. Never trust a client-computed disposition report, hide pending work, mutate input or claim a ticket is resolved. Reject unknown outcomes. Tests cover pending work, excluded-but-counted decisions, preserved evidence, empty input and immutability.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root. The existing Project 7 Worker configuration, bearer token, origin policy, body bounds and D1 setup apply. No new deployment configuration, migration, paid API, model, external call or runtime dependency. Free-tier quotas apply; source merge does not deploy.

## Product measures and trust boundaries

Proposed measures: pending decisions and agenda items requiring follow-up or investigation. These are snapshot counts, not stored trends or measured time savings. Owner and evidence labels remain manual assertions. No meeting is scheduled, document persisted, message sent, ticket changed or control closed. Save the request/output externally if durable meeting records are required. An empty agenda does not certify a healthy product or successful remediation.

[Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) emphasizes clear, tracked follow-up and sharing learning. A compact agenda is this product's extension of that principle, not a Google-prescribed meeting process.
