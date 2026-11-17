const label = (value, name) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) throw new Error(`Invalid ${name}`);
  return value.trim();
};

/** Reconcile proposed accountable owners against the entire computed review queue. */
export function assessPreventionOwnership(triage, assignments) {
  if (triage.omittedControls !== 0) throw new Error('Complete review queue required');
  if (!Array.isArray(assignments) || assignments.length > triage.queue.length) throw new Error('Invalid assignment count');
  const expected = new Set(triage.queue.map(row => row.controlId));
  const assigned = new Map();
  const tickets = new Set();
  for (const item of assignments) {
    const id = item?.controlId;
    if (!expected.has(id) || assigned.has(id)) throw new Error('Unknown or duplicate control assignment');
    const ticket = label(item.ticket, 'tracking reference');
    if (tickets.has(ticket)) throw new Error('Duplicate tracking reference');
    tickets.add(ticket);
    assigned.set(id, {owner:label(item.owner, 'owner'),ticket});
  }
  const controls = triage.queue.map(row => ({...row, assignment:assigned.get(row.controlId) ?? null}));
  const unassigned = controls.filter(row => !row.assignment).length;
  return {sourceReportId:triage.sourceReportId,followupReportId:triage.followupReportId,
    asOf:triage.asOf,controls,unassigned,status:!controls.length?'no_followup':unassigned?'ownership_incomplete':'ready_for_handoff'};
}
