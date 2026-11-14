# Project 62: Roadmap Prevention Evidence Verification

[Project 61](../roadmap_prevention_evidence_export/) produces an export with a checksum. A recipient needs a way to compare it with a digest received separately: changing the payload and its embedded checksum together can otherwise hide a change. This module uses the same deterministic JSON encoding and SHA-256 utility as Project 61. See [NIST FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) for the hash standard.

## Verify an export

In the Project 7 workspace, choose **Verify prevention evidence**, upload the export, and enter its separately trusted digest. Do not copy the digest from the file being checked. Obtain it from the original sender over an independently trusted channel.

The authenticated `POST /api/prevention-evidence-verify` endpoint expects `{ "envelope": <Project 61 export>, "expectedDigest": "<64 hex characters>" }`. It recomputes the checksum and reports `actualDigest`, `embeddedMatches`, `trustedMatches`, and `status`. Only both comparisons passing yields `digest_match`. Invalid inputs return an error; valid but mismatched inputs return `digest_mismatch`.

## Boundaries and tests

The existing Worker and UI host the module without new runtime dependencies or paid services. The verifier checks the v1 export marker, algorithm, digest shape, and bounded payload complexity. It does not validate all domain fields, reconstruct workflow evidence, authenticate a sender, or persist uploads. A digest match establishes consistency with a trusted digest, not that the claims inside the file are true.

Run `npm test` in this folder or the full repository suite with `node experiment-data-quality-auditor/scripts/test-all.mjs`.
