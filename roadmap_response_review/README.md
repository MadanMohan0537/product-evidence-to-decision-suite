# Project 70: Escalation Response Review Queue

Convert Project 68's validated response records into a deterministic human review queue. Project 69 provides coverage; this project adds explicit next actions instead of leaving teams to interpret ratios.

## Connected use and architecture

The existing authenticated `/api/escalation-responses` endpoint now returns `reviewQueue` alongside `summary`. Upload the existing Project 68 JSON request in Project 7's light/dark interface. The Worker reconstructs evidence, handoff and escalation before producing the queue; a client-computed report is not trusted. No new configuration or database migration is required.

Priority order is unrouted, not recorded sent, overdue response, awaiting response, late response. Timely replied rows are excluded. Ties sort by control ID. `immediate` counts the first three categories; awaiting work explicitly says to wait until its deadline. This ordering is a transparent product policy, not a measured severity model. It never interprets a response as remediation.

## Requirements and limitations

Preserve report IDs and observation time; retain status and deadline per control; reject unknown states; do not mutate source records; deterministically distinguish immediate review from waiting. Unit tests cover these boundaries. Success should be assessed by reduced unnoticed routing/send/response gaps, not queue size alone. No historical metrics collection is implemented.

Pure dependency-free JavaScript runs inside the existing Cloudflare Worker. Existing bearer token, origin controls, body bounds, D1 setup and deployment instructions remain those of Project 7. No paid API, model, scheduler, page, email, ticket change, persistence or external network call is introduced. Free hosting remains quota-bound. Source merge does not deploy.

Manual receipts and routes remain unverified human assertions. The queue does not certify delivery, identity, remediation, or compliance. Recompute when inputs change; it is not a live notification service.

## Tests and research

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root. [Google SRE alerting guidance](https://sre.google/workbook/alerting-on-slos/) emphasizes actionable signals and distinguishing response urgency. This queue applies that principle to communication follow-up; it does not implement SLO burn-rate alerting or claim Google's endorsement of its ordering.
