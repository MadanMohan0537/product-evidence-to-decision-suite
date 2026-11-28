# Project 76: Portable Communication Review Brief

Project 75 produces a structured meeting agenda. This module provides a portable Markdown representation so teams can save or paste the same evidence-linked review outside the workspace without manually rewriting it.

## Connected use

Use Project 7's existing **Monitor escalation responses** upload form or authenticated `/api/escalation-responses` endpoint with the existing Project 74/75 request. No new inputs are required. The response adds `reviewBriefExport` containing `mediaType`, a fixed safe `filename`, and Markdown `content`. The existing light/dark JSON interface displays these fields; copy the content or save it with an API client. No automatic download button is claimed.

## Architecture and contract

Verified upstream records → Project 74 dispositions → Project 75 brief → deterministic Markdown serializer. Includes observation time, both report IDs, counts and each agenda item's control, owner, ticket, outcome, action, rationale and evidence label. Missing fields say `Not recorded`. Empty agendas explicitly do not certify resolution. Labels are flattened to one line and Markdown/HTML syntax escaped, so supplied references are text rather than executable markup or active links.

Acceptance criteria: preserve the brief's order and counts, prevent label-based heading/link/HTML injection, expose missing labels, reject negative/noninteger counts, and never mutate source data. The pure helper expects the recomputed Project 75 contract, not arbitrary client reports.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root. Unit tests cover export metadata, missing values, markup escaping, empty agendas, invalid counts, determinism and immutability. The HTTP lifecycle test verifies the connected export.

## Deployment and limits

Dependency-free JavaScript imported by the existing Cloudflare Worker; no paid API, model, external call, new storage or migration. Existing Project 7 bearer token, origin controls, body limits, D1 setup and deployment instructions apply. Free quotas remain finite; merging source does not deploy.

Exports can contain owner names and internal references: review content before sharing. No automatic publishing, emailing, filesystem write, persistence, signature or integrity attestation is performed. Upstream receipts and reviewer labels remain human assertions. Markdown is a portable presentation, not proof of delivery, approval, compliance or remediation.

Proposed success measures: reduced manual meeting preparation and retained evidence references when sharing. No telemetry or historical metrics collection is implemented. [Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) motivates clear shared follow-up; Markdown export is this product's implementation choice.
