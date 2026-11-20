# Architecture

Project 7 verifies the two Project 61 evidence exports with Project 62, compares them in Project 63, builds a complete Project 64 queue, assesses Project 65 ownership and Project 66 acknowledgment, then constructs Project 67 drafts. Only then does `monitorResponses` assess supplied receipts.

The pure ES module performs linear bounded map lookups; at most 100 draft controls enter from the upstream route contract. No Node-only API, network call, LLM, or runtime dependency is used. Node's built-in test runner is development-only. The existing Worker configuration and assets deploy both UI and API.

The HTTP host supplies authentication, origin policy and input-size protection. Domain errors map to 422. Unit tests exercise the deterministic engine; the SQLite-backed HTTP lifecycle test exercises reconstruction plus rejection of mismatched contact. Receipts remain assertions, and expected export digests must be obtained independently as documented upstream. No module can turn a caller-provided expected digest into proof of origin.

The observation time and response policy are explicit inputs, not wall-clock reads. Results do not persist or change any upstream state. Resubmitting a different receipt set changes the assessment; immutable delivery history is outside scope.
