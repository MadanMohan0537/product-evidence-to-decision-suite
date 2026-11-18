function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) throw new Error('Use UTC ISO timestamps');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z','Z') !== value.replace('.000Z','Z')) throw new Error('Invalid UTC timestamp');
  return time;
}

/** Assess receipts against a recomputed Project 65 ownership result. */
export function assessHandoff(ownership, input) {
  const start = instant(ownership.asOf);
  const end = instant(input?.asOf);
  const hours = input.windowHours;
  if (end < start || !Number.isInteger(hours) || hours < 1 || hours > 720) throw new Error('Invalid assessment time or acknowledgment window');
  const deadline = start + hours * 3_600_000;
  const receipts = input.receipts;
  if (!Array.isArray(receipts) || receipts.length > ownership.controls.length) throw new Error('Invalid receipt count');
  const controls = new Map(ownership.controls.map(row => [row.controlId, row.assignment]));
  const received = new Map();
  for (const receipt of receipts) {
    const assignment = controls.get(receipt?.controlId);
    if (!assignment || received.has(receipt.controlId) || receipt.owner !== assignment.owner || receipt.ticket !== assignment.ticket) {
      throw new Error('Receipt must match a unique assigned control, owner and ticket');
    }
    const time = instant(receipt.acknowledgedAt);
    if (time < start || time > end) throw new Error('Receipt is outside the observation interval');
    received.set(receipt.controlId, time > deadline ? 'acknowledged_late' : 'acknowledged');
  }
  const rows = ownership.controls.map(({controlId, assignment}) => ({controlId, assignment,
    status: assignment ? received.get(controlId) ?? (end >= deadline ? 'overdue' : 'pending') : 'unassigned'}));
  const open = rows.filter(row => ['pending','overdue','unassigned'].includes(row.status)).length;
  return {sourceReportId:ownership.sourceReportId,followupReportId:ownership.followupReportId,
    asOf:input.asOf,dueAt:new Date(deadline).toISOString(),open,controls:rows,
    status:!rows.length ? 'no_followup' : open ? 'handoff_open' : 'handoff_acknowledged'};
}
