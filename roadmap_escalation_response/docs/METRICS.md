# Measures

- Send-record coverage: routed drafts with valid send receipts / routed drafts. Report denominator and unrouted count separately.
- Response coverage: sent drafts with recorded replies / sent drafts.
- Timely-response rate: replies at or before deadline / sent drafts whose deadline has elapsed. Do not drop unanswered overdue drafts from the denominator.
- Open follow-up count, broken down by unrouted, not recorded sent, awaiting response, and response overdue.
- Late reply count, preserved even when response coverage is complete.

No denominator means not applicable, not 100%. These are proposed operational metrics, not claimed measured outcomes. The module emits row-level statuses and an open count; it does not implement analytics collection or a historical metrics store. Communication coverage does not measure remediation success or causal business impact.
