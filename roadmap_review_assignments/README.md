# Project 71: Escalation Review Responsibility Register

Project 70 identifies communication follow-up, but a suggested action has no accountable reviewer. This module binds an explicit human owner and tracking reference to each queued control while retaining missing assignments.

## Use in ProdMind

Use Project 7's existing **Monitor escalation responses** upload form and authenticated `/api/escalation-responses` endpoint. Add optional `reviewAssignments` to the existing Project 68 request:

```json
{"reviewAssignments":[{"controlId":"archive-availability","owner":"Operations lead","ticket":"REVIEW-71"}]}
```

This is an additional-fields example, not a complete evidence request. The response adds `reviewResponsibilities` alongside the original response rows, coverage summary and review queue. The existing light/dark JSON interface displays it. Omitting assignments exposes all queued work as unassigned; unknown or duplicate controls and blank owner/ticket labels fail with HTTP 422. Labels are trimmed and limited to 120 characters. Timely replied controls excluded by Project 70 cannot receive review assignments.

## Architecture and requirements

Verified evidence and escalation reconstruction → Project 68 responses → Project 70 review queue → pure responsibility mapper. Only the server-recomputed queue is used. Preserve report IDs, observation time, order and next actions. Never hide unassigned work or mutate upstream ownership. Status is `no_review_work`, `review_ownership_incomplete`, or `review_ownership_recorded`.

The dependency-free ES module runs in the existing Cloudflare Worker with its bearer authentication, origin policy, bounded request body and D1 setup. No new database migration, service, paid API, model, runtime package or deployment configuration is needed. Follow Project 7's deployment instructions. Free hosting is quota-bound; source merge does not deploy.

## Boundaries and measures

This is a read-only assessment, not persistent registration, identity verification, ticket creation, acceptance, reassignment of original prevention owners, or remediation. Save the request/result if a durable record is needed. Ticket and owner strings are unverified human assertions. No external system is contacted.

Measure missing review ownership and assignment coverage (assigned/queued, undefined when the queue is empty). These are proposed operational measures, not collected historical analytics or proof that actions were completed.

## Verification and rationale

Run `npm test` here, or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root. Tests cover omitted responsibilities, valid mapping, input immutability, invalid assignments and empty queues.

[Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) emphasizes specific action items and formal tracking. This module applies that principle to communication review rather than claiming to implement a postmortem system or certify completion.
