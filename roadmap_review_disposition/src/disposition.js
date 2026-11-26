const label = value => typeof value === 'string' && Boolean(value.trim()) && value.length <= 500;

/** Record declared human review outcomes, never close the underlying control. */
export function assessReviewDispositions(report, decisions = []) {
  if (!Array.isArray(decisions) || decisions.length > report.controls.length) throw new Error('Invalid review decisions');
  const controls = new Map(report.controls.map(row => [row.controlId,row]));
  const recorded = new Map();
  for (const decision of decisions) {
    const row = controls.get(decision?.controlId);
    if (!row?.reviewAssignment || recorded.has(decision.controlId) ||
        decision.owner !== row.reviewAssignment.owner || decision.ticket !== row.reviewAssignment.ticket ||
        !['follow_up','investigate','no_further_communication'].includes(decision.outcome) ||
        !label(decision.rationale) || !label(decision.evidenceReference)) throw new Error('Decision must match unique assigned review and include outcome, rationale and evidence');
    recorded.set(decision.controlId,{outcome:decision.outcome,rationale:decision.rationale.trim(),evidenceReference:decision.evidenceReference.trim()});
  }
  const rows = report.controls.map(row=>({...row,disposition:recorded.get(row.controlId) ?? null}));
  return {sourceReportId:report.sourceReportId,followupReportId:report.followupReportId,asOf:report.asOf,
    controls:rows,pending:rows.length-recorded.size,
    status:!rows.length?'no_review_work':recorded.size===rows.length?'review_outcomes_recorded':'review_outcomes_incomplete',
    warning:'Declared communication review only. No ticket, response state or prevention control is closed.'};
}
