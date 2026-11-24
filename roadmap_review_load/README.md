# Project 72: Review Ownership Load Summary

Project 71 binds communication follow-up to reviewers. This module makes concentration and missing ownership visible without pretending task counts measure engineering capacity.

## Connected use

Use the existing Project 7 **Monitor escalation responses** form and authenticated `/api/escalation-responses` endpoint. Supply the same evidence, response monitoring and optional `reviewAssignments` documented in Project 71. No new input fields are required. The JSON response adds `reviewLoad`, rendered by the existing light/dark upload interface.

The server reconstructs evidence, responses, queue and responsibility assignments before grouping them. A client cannot replace the server-generated responsibility report. Each owner group retains control IDs, tracking references, statuses, total count and immediate-review count. Groups sort by immediate count, then total count, then owner label. Unassigned rows stay visible and remain in the assignment-coverage denominator. Empty coverage is null, not 100%.

## Architecture and acceptance criteria

Project 68 responses → Project 70 queue → Project 71 assignments → dependency-free ES module → existing Worker JSON response. Preserve report lineage and observation time; do not merge distinct control records even if their ticket strings match; retain missing work; do not mutate source records. Tests cover these boundaries and invalid labels.

Run `npm test` here, or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the repository root. Existing Project 7 token, origin controls, request limits, D1 setup and deployment configuration apply. No paid API, runtime package, new migration, external request or separate Worker is introduced. Free hosting remains quota-bound. Source merge does not deploy to Cloudflare.

## Product measures and limits

Proposed measures: missing ownership count, assignment coverage and concentration of immediate review tasks. These are snapshot measures, not stored trends. Owner labels are case-sensitive human assertions, not authenticated identities. Counts do not estimate effort, staffing, availability or overload and do not automatically reassign tasks. This read-only endpoint does not persist registrations, create tickets, notify owners or establish remediation success.

Research: [Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) emphasizes tracked, actionable follow-up. Making declared ownership inspectable is this product's extension of that principle, not a capacity model prescribed by Google.
