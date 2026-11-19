const label = value => typeof value === 'string' && Boolean(value.trim()) && value.length <= 120;

/** Draft escalation contacts only for overdue or unassigned handoffs. */
export function planEscalation(handoff, routes) {
  if (!Array.isArray(routes) || routes.length > 100) throw new Error('Provide at most 100 routes');
  const targets = handoff.controls.filter(row => ['overdue','unassigned'].includes(row.status));
  const expected = new Set(targets.map(row => row.controlId));
  const mapped = new Map();
  for (const route of routes) {
    if (!route || !expected.has(route.controlId) || mapped.has(route.controlId) ||
        !label(route.contact) || !label(route.channel) || !label(route.runbook)) throw new Error('Unique actionable routes required for eligible controls');
    mapped.set(route.controlId,{contact:route.contact.trim(),channel:route.channel.trim(),runbook:route.runbook.trim()});
  }
  const drafts = targets.map(row => ({
    controlId:row.controlId,reason:row.status,owner:row.assignment?.owner ?? null,
    ticket:row.assignment?.ticket ?? null,route:mapped.get(row.controlId) ?? null,
  }));
  return {sourceReportId:handoff.sourceReportId,followupReportId:handoff.followupReportId,
    asOf:handoff.asOf,drafts,unrouted:drafts.filter(item=>!item.route).length,
    status:!drafts.length?'no_escalation':drafts.some(item=>!item.route)?'routing_incomplete':'ready_for_manual_escalation'};
}
