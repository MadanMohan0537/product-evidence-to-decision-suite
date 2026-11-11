const bounded = value => typeof value === 'string' && Boolean(value.trim()) && value.length <= 1000;
const actor = value => value.trim().toLowerCase();

/** Review evidence for the exact prevention plan; never close incidents. */
export function verifyPreventionFollowthrough(plan, review) {
  if (plan?.status !== 'ready_for_human_review' || !plan.actions?.length) throw new Error('Reviewable Project 58 plan required');
  if (review?.sourceReportId !== plan.sourceReportId || review?.followupReportId !== plan.followupReportId) throw new Error('Recovery lineage mismatch');
  const start = Date.parse(plan.asOf);
  const end = Date.parse(review.asOf);
  if (!(end > start)) throw new Error('Follow-through must postdate the plan');
  if (!Array.isArray(review.evidence) || review.evidence.length > plan.actions.length) throw new Error('Provide evidence for plan actions only');
  const expected = new Map(plan.actions.map(action => [action.id, action]));
  const evidence = new Map();
  for (const item of review.evidence) {
    const action = expected.get(item?.actionId);
    if (!action || evidence.has(item.actionId)) throw new Error('Evidence action IDs must be unique and in the plan');
    const completed = Date.parse(item.completedAt);
    const checked = Date.parse(item.checkedAt);
    if (!(start < completed && completed <= checked && checked <= end)) throw new Error('Invalid execution or verification chronology');
    if (![item.verifier,item.reference].every(bounded) || actor(item.verifier) === actor(action.owner) ||
        item.measure !== action.measure || typeof item.passed !== 'boolean') throw new Error('Independent evidence against the planned measure required');
    evidence.set(item.actionId,item);
  }
  const actions = plan.actions.map(action => {
    const record = evidence.get(action.id);
    const late = (record ? Date.parse(record.completedAt) : end) > Date.parse(action.dueAt);
    return {id:action.id, controlId:action.controlId, owner:action.owner, late,
      status:record ? (record.passed ? 'verified' : 'measure_failed') : 'awaiting_evidence',
      ...(record && {reference:record.reference,verifier:record.verifier})};
  });
  return {sourceReportId:plan.sourceReportId,followupReportId:plan.followupReportId,actions,
    status:actions.every(item => item.status === 'verified') ? 'followthrough_verified' : 'followthrough_open'};
}
