# Project 61: Roadmap Prevention Evidence Export

Share a compact snapshot of roadmap recovery and prevention checks without exporting all the underlying notes and evidence. This extends Projects 57–60 and reuses Project 24's digest utility rather than introducing another hashing implementation.

## Use it

In Project 7, choose **Export prevention evidence**, upload the complete [Project 60 request](../roadmap_prevention_revalidation/README.md), and download the JSON. Or POST that same request to authenticated `/api/prevention-evidence-export`.

The Worker reconstructs the recovery, plan, initial verification, and revalidation. The export retains the source and follow-up IDs, assessment time and age limit, stage statuses, action/control IDs, and per-action status and check time. A missing, stale or failed check remains visible. Earlier stages that do not meet the revalidation prerequisites return a validation error rather than an export.

The summary does not copy lessons, action measures, names in owner/reviewer fields, or evidence references. IDs are still caller-supplied and can contain sensitive values: review them before sharing.

## Integrity and limitations

The envelope contains `payload` and `integrity: { algorithm, digest }`. To check a digest in Node 22, import `sha256` from `decision_provenance_pack/src/provenance.js` and compare `await sha256(envelope.payload)` with `envelope.integrity.digest`. This reuses ProdMind's sorted-key JSON encoding. [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) motivates deterministic encoding; this module does not claim full RFC conformance.

The digest is not a signature: anyone can replace the summary and recompute it. Compare against a digest obtained through a trusted channel if authenticity matters. The export is an as-of summary, not live monitoring or proof that evidence is genuine. It does not modify or persist workflow records.

No new service or runtime dependency is required. Run `npm test` here or `node experiment-data-quality-auditor/scripts/test-all.mjs` at the repository root.
