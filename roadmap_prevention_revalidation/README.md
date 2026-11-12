# Project 60: Roadmap Prevention Revalidation Monitor

[Project 59](../roadmap_prevention_followthrough/) checks initial implementation evidence. Project 60 evaluates **later repeat checks** for those exact prevention actions, separating missing, stale, and failed evidence. Unlike the baseline drift monitor, it checks whether the preventive measures are still being tested, not whether configuration drift has actually recurred. [NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final) provides the continuous-monitoring rationale; the age limit here is a user policy, not a NIST requirement.

## Usage

Use **Revalidate prevention checks** in Project 7 or authenticated `POST /api/prevention-revalidation`. Start with the complete Project 59 request and add `revalidation`:

```json
{
  "sourceReportId": "baseline-drift-1",
  "followupReportId": "baseline-drift-recovered",
  "asOf": "2027-04-14T00:00:00Z",
  "maximumAgeHours": 24,
  "checks": [{
    "actionId": "archive-probe",
    "checkedAt": "2027-04-13T12:00:00Z",
    "verifier": "Assurance",
    "reference": "Repeat probe receipt",
    "measure": "Probe raises a test alert when the archive cannot be read",
    "passed": true
  }]
}
```

Use timezone-qualified timestamps and an age limit of 1–2160 hours. Checks must follow initial verification, use the original measure, and name a verifier other than the action owner. One check per action is allowed. All actions need a passing check at or within the age limit for `prevention_checks_current`; otherwise the result is `review_required`.

## Runtime and tests

The authenticated Project 7 Cloudflare Worker reconstructs the recovery, prevention plan, and initial verification before passing them to the deterministic engine. The module introduces no paid service or runtime dependency. It does not schedule or execute checks, verify submitted identities or references, persist results, or modify incident state.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` at the repository root.
