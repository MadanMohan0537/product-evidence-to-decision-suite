/** Build a deterministic meeting brief from recomputed review dispositions. */
export function buildReviewBrief(report) {
  const counts = {pending:0,follow_up:0,investigate:0,no_further_communication:0};
  const agenda = [];
  for (const row of report.controls) {
    const outcome = row.disposition?.outcome ?? 'pending';
    if (!Object.hasOwn(counts,outcome)) throw new Error('Unknown review outcome');
    counts[outcome]++;
    if (outcome !== 'no_further_communication') agenda.push({controlId:row.controlId,
      owner:row.reviewAssignment?.owner ?? null,ticket:row.reviewAssignment?.ticket ?? null,
      outcome,action:row.action,rationale:row.disposition?.rationale ?? null,
      evidenceReference:row.disposition?.evidenceReference ?? null});
  }
  return {sourceReportId:report.sourceReportId,followupReportId:report.followupReportId,asOf:report.asOf,
    counts,agenda,total:report.controls.length,
    warning:'Meeting preparation only. Excluded communication decisions do not establish control resolution.'};
}
