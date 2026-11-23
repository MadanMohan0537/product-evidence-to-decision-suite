const label = value => typeof value === 'string' && Boolean(value.trim()) && value.length <= 120;

/** Bind optional human review responsibilities to the recomputed Project 70 queue. */
export function assignReviews(queue, assignments = []) {
  if (!Array.isArray(assignments) || assignments.length > queue.controls.length) throw new Error('Invalid review assignments');
  const expected = new Set(queue.controls.map(row => row.controlId));
  const mapped = new Map();
  for (const item of assignments) {
    if (!item || !expected.has(item.controlId) || mapped.has(item.controlId) || !label(item.owner) || !label(item.ticket)) throw new Error('Unique queued control, owner and ticket required');
    mapped.set(item.controlId, {owner:item.owner.trim(),ticket:item.ticket.trim()});
  }
  const controls = queue.controls.map(row => ({...row,reviewAssignment:mapped.get(row.controlId) ?? null}));
  const unassigned = controls.filter(row => !row.reviewAssignment).length;
  return {sourceReportId:queue.sourceReportId,followupReportId:queue.followupReportId,asOf:queue.asOf,
    controls,unassigned,status:!controls.length?'no_review_work':unassigned?'review_ownership_incomplete':'review_ownership_recorded',
    warning:'Review ownership is a human assertion, not ticket creation or remediation.'};
}
