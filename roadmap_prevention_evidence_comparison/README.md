# Project 63: Roadmap Prevention Evidence Comparison

Project 60 evaluates one point in time. Projects 61 and 62 export it and verify its checksum. Project 63 compares two such exports to show which prevention checks fell out of date, recovered, or changed failure state. It complements the broader control recurrence monitor by comparing exported roadmap prevention status rather than measuring incidents.

## Run a comparison

In Project 7, upload a JSON file under **Compare prevention evidence**, or submit the same JSON to authenticated `POST /api/prevention-evidence-compare`:

```text
previous: { envelope: <older Project 61 export>, expectedDigest: <trusted digest> }
latest:   { envelope: <newer Project 61 export>, expectedDigest: <trusted digest> }
```

Supply both digests separately through a trusted channel. The Worker uses Project 62 to verify both exports before comparing them. The exports must share recovery IDs, freshness policy, action IDs and control links, and the latest assessment must be strictly newer. The response lists previous and latest status per action, sorted by ID, with a change of `unchanged`, `became_current`, `lost_currency`, or `changed_noncurrent`.

## Architecture and limits

This is a dependency-free module in the existing Cloudflare Worker. It does not store uploads, execute checks, or infer causality. Matching digests establish integrity against the supplied reference, not truth. Matching IDs do not prove that an unexported action measure is unchanged; do not reuse action IDs for changed measures. The comparison draws on [NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final) for the value of continuing visibility into control effectiveness.

Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` from the repository root.
