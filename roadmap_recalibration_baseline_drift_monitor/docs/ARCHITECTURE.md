# Architecture

```text
Project 55 completed baseline handoff
              ↓
Chronological configuration snapshots
              ↓
Version + manifest + class + consumer checks
              ↓
Archive + rollback + monitoring obligations
              ↓
Retain | Remediate | Freeze human decision
```

The zero-dependency engine is shared by the standalone Worker and Project 7. In the connected route, Project 7 reconstructs Projects 40–55 server-side before invoking this monitor. The Worker fails closed without a bearer token, rejects cross-origin API calls, bounds JSON requests to 2 MB, and does not persist secrets.
