# Project 68: Roadmap Escalation Response Monitor

**Know which escalations still need a human response—without confusing a draft, a sent message, and a resolved problem.**

[Project 67](../roadmap_handoff_escalation/) prepares escalation drafts when prevention-control handoffs are overdue or unassigned. This module closes the communication-tracking gap: it checks manually recorded send and reply receipts against those exact drafts and a declared response window.

## What it delivers

- Distinct states for unrouted, not recorded sent, awaiting response, response overdue, responded, and responded late.
- A response deadline computed from the recorded send time, not from draft creation.
- Exact control/contact/channel/runbook matching, unique receipts, bounded response policy, and strict UTC timestamps.
- Original source and follow-up report IDs retained in every assessment.
- An authenticated API and accessible upload form in the existing light/dark Project 7 workspace.
- No new runtime packages, paid API, model, storage service, cron job, or messaging integration.

## Use in the connected product

Open Project 7 and choose **Monitor escalation responses**, or POST JSON to `/api/escalation-responses` with its configured bearer token. Use the same body as `/api/handoff-escalation` (`previous`, `latest`, `assignments`, `handoff`, `routes`) and add:

```json
{
  "responseMonitoring": {
    "asOf": "2027-04-17T00:00:00Z",
    "responseWindowHours": 4,
    "receipts": [{
      "controlId": "archive-availability",
      "contact": "Duty lead",
      "channel": "Internal queue",
      "runbook": "RB-1",
      "reference": "MSG-68",
      "sentAt": "2027-04-16T01:00:00Z",
      "response": {
        "contact": "Duty lead",
        "reference": "REPLY-68",
        "at": "2027-04-16T05:30:00Z"
      }
    }]
  }
}
```

This is an additional-fields example, not a complete evidence request. Omit `response` until a reply is recorded; use `receipts: []` to expose unsent work. Contact, channel and runbook must exactly match the normalized Project 67 route. An eligible draft without a route cannot accept a receipt. Invalid inputs return HTTP 422; unauthorized calls return 401.

The example reply is late: the deadline is 05:00 UTC. At the exact deadline an unanswered escalation is overdue; a reply recorded at that instant is timely. Valid observation times start at the Project 67 assessment time. Send times must be between that start and the new observation time; replies must be between send and observation. The response window is an integer from 1 to 720 hours.

### Result contract

`controls` contains each draft plus `status`, `dueAt`, and its supplied receipt (or null). `open` counts rows without replies. Aggregate `status` is `no_escalation`, `response_followup_required`, or `responses_recorded`. Late replies remain explicitly late even when `open` becomes zero. No result means the prevention control is fixed.

## Run and deploy

```sh
cd roadmap_escalation_response
npm test
# From the repository root:
node experiment-data-quality-auditor/scripts/test-all.mjs
```

For the UI/API, follow [Project 7 setup](../experiment-data-quality-auditor/README.md): its Worker imports this dependency-free ES module, serves the frontend, and enforces bearer authentication, origin checks, and a 2 MB request limit. No separate Worker or database migration is required. Keep the configured token out of source control. Existing D1 binding/setup is still required by the host even though this endpoint does not persist receipts.

Cloudflare's free tier has finite request, CPU, and storage quotas. Small bounded assessments require no paid dependencies; this is not a promise of unlimited free hosting. Benchmark representative evidence payloads before production use. No Cloudflare deployment is performed merely by merging source.

## Trust boundaries and deliberate exclusions

Receipts are human assertions, not verified delivery logs or authenticated signatures. The caller supplies the observation clock and policy. This is a single-team bearer-token workspace, not per-person identity or multitenant authorization. Receipt references are labels; the service does not fetch them. Save the request/output externally if a durable communication record is needed: rerunning with the same inputs is deterministic, but this endpoint does not keep a queue, poll, page, send messages, resolve tickets, transfer ownership, or certify remediation.

## Why this belongs in ProdMind

Evidence comparison → triage → ownership → acknowledgment → escalation draft → **recorded communication and response follow-up**. Product teams can see where verified evidence failed to reach an accountable responder, while keeping the original failed prevention checks separate from communication status.

Research: [Google SRE Incident Response](https://sre.google/workbook/incident-response/) distinguishes coordination/communication from actual resolution and recommends regular updates. [Managing Incidents](https://sre.google/sre-book/managing-incidents/) emphasizes explicit acknowledgment. [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/) inform bounded, dependency-free execution. These sources motivate the design; they do not prescribe this module's hour window or certify it.

See [PRD](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), and [metrics](docs/METRICS.md).
