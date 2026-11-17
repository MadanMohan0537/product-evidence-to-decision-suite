# Project 65: Roadmap Prevention Ownership Check

[Project 64](../roadmap_prevention_triage/) ranks outstanding controls. This project checks that each control has a single proposed accountable owner and a distinct tracking reference before a team hands off the work. The design draws on [Google SRE postmortem guidance](https://sre.google/workbook/postmortem-culture/) on ownership and tracking.

## Use it

In Project 7 select **Check prevention ownership**, or send JSON to authenticated `POST /api/prevention-ownership`. Start with the complete [Project 63 comparison request](../roadmap_prevention_evidence_comparison/README.md) and add an `assignments` array, for example:

```json
{"assignments":[{"controlId":"archive-availability","owner":"Records operations","ticket":"OPS-57"}]}
```

The existing Cloudflare Worker verifies both snapshot digests, recomputes the comparison, and builds the complete triage queue regardless of any display limit supplied. The deterministic checker rejects duplicate controls, reused ticket references, blank values, and unknown controls. It returns `ready_for_handoff`, `ownership_incomplete` with unassigned controls, or `no_followup` if the queue is empty.

Tickets and owners are user-supplied labels. This feature does not confirm identity, check ticket existence, notify owners, persist assignments, or declare a control resolved. It requires no paid service or runtime dependency.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the repository root.
