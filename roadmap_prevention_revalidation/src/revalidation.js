const HOUR = 3_600_000;
const validText = value => typeof value === 'string' && value.trim() && value.length <= 1000;
const actor = value => value.trim().toLowerCase();

/** Recheck deployed prevention measures after initial follow-through. */
export function revalidatePrevention(plan, verified, initialAsOf, input) {
  if (verified?.status !== 'followthrough_verified') throw new Error('Verified Project 59 follow-through required');
  if (input?.sourceReportId !== plan.sourceReportId || input?.followupReportId !== plan.followupReportId) throw new Error('Recovery lineage mismatch');
  const initial = Date.parse(initialAsOf);
  const asOf = Date.parse(input.asOf);
  if (!(asOf > initial)) throw new Error('Revalidation must follow initial verification');
  const hours = input.maximumAgeHours;
  if (!Number.isInteger(hours) || hours < 1 || hours > 2160) throw new Error('maximumAgeHours must be 1–2160');
  if (!Array.isArray(input.checks) || input.checks.length > plan.actions.length) throw new Error('Provide at most one check per action');
  const expected = new Map(plan.actions.map(action => [action.id, action]));
  const checks = new Map();
  for (const check of input.checks) {
    const action = expected.get(check?.actionId);
    if (!action || checks.has(check.actionId)) throw new Error('Checks must target unique planned actions');
    const at = Date.parse(check.checkedAt);
    if (!(initial < at && at <= asOf)) throw new Error('Check time must be after initial verification and at or before asOf');
    if (![check.verifier,check.reference].every(validText) || actor(check.verifier) === actor(action.owner) ||
        check.measure !== action.measure || typeof check.passed !== 'boolean') throw new Error('Independent check against the original measure required');
    checks.set(check.actionId, {...check, checkedAt:new Date(at).toISOString(), stale:asOf-at > hours*HOUR});
  }
  const actions = plan.actions.map(({id,controlId,measure}) => {
    const check = checks.get(id);
    const status = !check ? 'missing' : !check.passed ? 'failed' : check.stale ? 'stale' : 'current';
    return {id,controlId,measure,status,...(check && {checkedAt:check.checkedAt,reference:check.reference,verifier:check.verifier,stale:check.stale})};
  });
  return {sourceReportId:plan.sourceReportId,followupReportId:plan.followupReportId,asOf:new Date(asOf).toISOString(),
    maximumAgeHours:hours,actions,status:actions.every(action=>action.status==='current') ? 'prevention_checks_current' : 'review_required'};
}
