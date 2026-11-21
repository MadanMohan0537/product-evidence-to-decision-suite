/** Summarize recomputed Project 68 rows without treating replies as resolution. */
export function summarizeResponses(report) {
  const counts = Object.fromEntries(['unrouted','not_recorded_sent','awaiting_response','response_overdue','responded','responded_late'].map(key => [key, 0]));
  for (const row of report.controls) {
    if (!Object.hasOwn(counts, row.status)) throw new Error('Unknown response status');
    counts[row.status]++;
  }
  const total = report.controls.length;
  const routed = total - counts.unrouted;
  const sent = routed - counts.not_recorded_sent;
  const replied = counts.responded + counts.responded_late;
  return {sourceReportId:report.sourceReportId, followupReportId:report.followupReportId,
    asOf:report.asOf, counts, total, routed, sent, replied,
    sendCoverage:routed ? sent/routed : null,
    responseCoverage:sent ? replied/sent : null,
    open:total-replied,
    warning:'Communication coverage is not remediation success; receipts are manual assertions.'};
}
