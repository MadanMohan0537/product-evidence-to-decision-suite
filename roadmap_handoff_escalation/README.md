# Project 67: Roadmap Handoff Escalation Planner

[Project 66](../roadmap_prevention_handoff/) identifies missing acknowledgments. Project 67 prepares manual escalation records for overdue or unassigned controls, without paging anyone. Pending work and acknowledged handoffs, including late acknowledgments, do not enter this queue.

## Use it

In Project 7 select **Draft handoff escalation**, or POST to authenticated `/api/handoff-escalation`. Start with a Project 66 request and add:

```json
{"routes":[{"controlId":"archive-availability","contact":"Duty lead","channel":"Internal incident queue","runbook":"RB-1"}]}
```

The existing Cloudflare Worker verifies the evidence snapshots and reconstructs ownership and acknowledgment before preparing drafts. Each draft retains the control, overdue/unassigned reason, proposed owner and ticket, and supplied contact/channel/runbook. Missing routes stay visible; duplicate or ineligible routes are rejected.

This is a deterministic planning step inspired by [Google SRE incident-response practices](https://sre.google/workbook/incident-response/), not an incident-management service. Routes are unverified labels, not authenticated recipients. The tool never sends messages, creates tickets, changes owners, persists a queue, or closes controls. Review routes before acting on a draft.

No paid service or runtime dependency is required. Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the repository root.
