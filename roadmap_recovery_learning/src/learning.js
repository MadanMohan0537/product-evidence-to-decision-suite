const nonempty = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;

/** Assess a prevention plan, not live controls or incident closure. */
export function assessRecoveryLearning(recovery, plan) {
  if (recovery?.status !== 'recovery_evidence_complete') throw new Error('Verified Project 57 recovery evidence required');
  if (plan?.sourceReportId !== recovery.sourceReportId || plan?.followupReportId !== recovery.followupReportId) {
    throw new Error('Recovery report lineage mismatch');
  }
  const asOf = Date.parse(plan.asOf);
  if (!Number.isFinite(asOf) || !nonempty(plan.lesson)) throw new Error('Assessment time and a lesson are required');
  if (!Array.isArray(plan.actions) || plan.actions.length > 100) throw new Error('Provide at most 100 prevention actions');
  const controls = new Set(recovery.restored.filter(item => item.restored === true).map(item => item.id));
  if (!controls.size) throw new Error('No restored controls to review');
  const seen = new Set();
  const actions = plan.actions.map(action => {
    if (!action || !controls.has(action.controlId) || ![action.id, action.owner, action.measure].every(nonempty) || seen.has(action.id.trim())) {
      throw new Error('Unique owned actions with a verification measure and restored-control link required');
    }
    seen.add(action.id.trim());
    const due = Date.parse(action.dueAt);
    if (!Number.isFinite(due)) throw new Error('Action deadline required');
    return {id:action.id.trim(),controlId:action.controlId,owner:action.owner.trim(),measure:action.measure.trim(),dueAt:new Date(due).toISOString(),overdue:due <= asOf};
  });
  const uncovered = [...controls].filter(id => !actions.some(action => action.controlId === id && !action.overdue));
  return {sourceReportId:recovery.sourceReportId,followupReportId:recovery.followupReportId,
    asOf:new Date(asOf).toISOString(),lesson:plan.lesson.trim(),actions,uncovered,
    status:uncovered.length || actions.some(action => action.overdue) ? 'needs_prevention_plan' : 'ready_for_human_review'};
}
