# Project 58: Roadmap Recovery Learning & Prevention Planner

Project 57 checks whether configuration recovery evidence is complete. Project 58 answers the next question: **What will we change or measure to reduce the chance of recurrence?** It follows [Google SRE's postmortem guidance](https://sre.google/workbook/postmortem-culture/) on learning from incidents and tracking concrete follow-up actions.

## Use in the connected workspace

In [Project 7](../experiment-data-quality-auditor/), upload a JSON assessment under **Project 58: Plan drift prevention**, or send it to authenticated `POST /api/recovery-learning`. Use the same `sourceAssessment`, `followupAssessment`, `actions`, and `review` as the [Project 57 connected endpoint](../roadmap_configuration_recovery/README.md). Add:

```json
{
  "prevention": {
    "sourceReportId": "baseline-drift-1",
    "followupReportId": "baseline-drift-recovered",
    "asOf": "2027-04-08T06:00:00Z",
    "lesson": "Detect archive access loss earlier.",
    "actions": [{
      "id": "archive-probe",
      "controlId": "archive-availability",
      "owner": "Records operations",
      "measure": "A simulated unreadable archive triggers a test alert.",
      "dueAt": "2027-04-15T00:00:00Z"
    }]
  }
}
```

The Worker recomputes Project 57 recovery from the supplied assessments and workspace runs. The deterministic engine validates report IDs, restored-control links, owners, measures, and deadlines. It returns `ready_for_human_review` only if every restored control has a current action and none of the actions is overdue; otherwise it returns `needs_prevention_plan` with uncovered controls. It does not validate claims of root cause, execute work, persist plans, or certify prevention effectiveness.

## Runtime and tests

This module uses the existing Cloudflare Worker and workspace frontend; there is no separate service or paid dependency. See the workspace README for setup and authentication. Run `npm test` in this folder for unit tests, or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the root for the connected lifecycle and complete suite.
