# Metrics

| Metric | Definition | Guardrail |
|---|---|---|
| Snapshot coverage | Supplied snapshots / required snapshots | Do not count malformed or duplicated snapshots |
| Configuration alignment | Fully aligned snapshots / accepted snapshots | Version, manifest, class, and all consumers must agree |
| Consumer drift | Distinct required consumers observed out of convergence | A healthy flag never overrides a version mismatch |
| Detection latency | Time from first drifted snapshot to reviewed decision | Do not infer the actual configuration-change time |
| Archive runway | Days from assessment to retention expiry | Availability and immutability remain explicit inputs |
| Rollback age | Days since the latest reviewed rollback exercise | Freshness is not proof a future rollback will succeed |
| Monitoring completion | Due obligations completed by deadline / due obligations | Future scheduled obligations are not counted as complete |
| Remediation acceptance | Drift reviews receiving an owned remediation decision | The monitor never performs remediation |
