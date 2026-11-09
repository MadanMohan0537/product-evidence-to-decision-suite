/** Verify restoration of originally failed controls; never execute remediation. */
export function verifyConfigurationRecovery(source, followup, actions, review) {
  if (!source || !followup || !Array.isArray(source.checks) || !Array.isArray(followup.checks)) throw new Error('Two monitoring reports required');
  if (source.schemaVersion !== '1.0.0' || followup.schemaVersion !== '1.0.0') throw new Error('Unsupported report schema');
  for (const report of [source, followup]) {
    if (!Array.isArray(report.scope) || !report.scope.length || report.scope.length > 50 || report.scope.some(value => typeof value !== 'string' || !value.trim()) || new Set(report.scope).size !== report.scope.length) throw new Error('Unique nonempty scope required');
    if (!report.checks.length || report.checks.length > 100) throw new Error('Bounded nonempty controls required');
    const ids = new Set();
    for (const control of report.checks) {
      if (!control || typeof control.id !== 'string' || !control.id.trim() || ids.has(control.id) || typeof control.passed !== 'boolean') throw new Error('Unique boolean controls required');
      ids.add(control.id);
    }
  }
  if (source.scope.length !== followup.scope.length || source.scope.some(value => !followup.scope.includes(value))) throw new Error('Recovery scope must match source');
  if (source.checks.length !== followup.checks.length || source.checks.some(control => !followup.checks.some(item => item.id === control.id))) throw new Error('Follow-up control set must match source');
  if (!source.id || !followup.id || source.id === followup.id) throw new Error('Distinct report IDs required');
  if (!Number.isFinite(Date.parse(source.asOf)) || !Number.isFinite(Date.parse(followup.asOf)) || Date.parse(followup.asOf) <= Date.parse(source.asOf)) throw new Error('Follow-up must be later');
  for (const key of ['sourceHandoffId', 'activeVersion', 'factorManifestId']) {
    if (!source[key] || source[key] !== followup[key]) throw new Error(`Changed ${key}`);
  }
  if (!Array.isArray(actions) || actions.length > 100) throw new Error('Bounded actions required');
  const failed = source.checks.filter(item => item.passed === false).map(item => item.id);
  if (!failed.length) throw new Error('Source must contain failed controls');
  const seen = new Set();
  const completed = new Map();
  for (const action of actions) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Action object required');
    if (typeof action.id !== 'string' || !action.id.trim() || action.id.length > 120) throw new Error('Bounded action ID required');
    if (typeof action.owner !== 'string' || typeof action.evidence !== 'string' || action.owner.length > 120 || action.evidence.length > 2000) throw new Error('Bounded action owner and evidence required');
    if (!['planned', 'in_progress', 'completed'].includes(action.status)) throw new Error('Invalid action status');
    if (!action.id || seen.has(action.id)) throw new Error('Unique action IDs required');
    seen.add(action.id);
    if (!action.owner?.trim() || !action.evidence?.trim() || !failed.includes(action.controlId)) throw new Error('Owned evidence-linked actions required');
    if (action.status === 'completed') {
      const approved = Date.parse(action.approvedAt);
      const finished = Date.parse(action.completedAt);
      if (typeof action.approvedBy !== 'string' || !action.approvedBy.trim() || sameActor(action.approvedBy, action.owner) ||
          !(Date.parse(source.asOf) <= approved && approved <= finished && finished < Date.parse(followup.asOf))) {
        throw new Error('Completed action requires independent approval and chronological execution');
      }
      if (completed.has(action.controlId)) throw new Error('One completed action per control required');
      completed.set(action.controlId, finished);
    }
  }
  const restored = failed.map(id => ({id, restored: followup.checks.some(item => item.id === id && item.passed === true) && completed.has(id)}));
  const cutoff = Math.max(...completed.values(), Date.parse(source.asOf));
  const observations = (Array.isArray(followup.snapshots) ? followup.snapshots : [])
    .filter(item => Date.parse(item?.observedAt) > cutoff);
  const times = observations.map(item => Date.parse(item.observedAt));
  const stableObservation = times.length >= 2 && times.at(-1) - times[0] >= 3_600_000 &&
    times.at(-1) <= Date.parse(followup.asOf) &&
    observations.every((item, index) => item.aligned === true && (!index || times[index] > times[index - 1]));
  const independentReview = typeof review?.reviewer === 'string' && Boolean(review.reviewer.trim()) &&
    review.decision === 'accept_evidence' && Date.parse(review.reviewedAt) >= Date.parse(followup.asOf) &&
    actions.every(action => !sameActor(review.reviewer, action.owner) && !sameActor(review.reviewer, action.approvedBy));
  return {schemaVersion: '1.0.0', sourceReportId: source.id, followupReportId: followup.id, restored, stableObservation, independentReview,
    status: restored.every(item => item.restored) && followup.checks.every(item => item.passed) && stableObservation && independentReview
      ? 'recovery_evidence_complete' : 'recovery_incomplete'};
}

function sameActor(left, right) {
  return typeof right === 'string' && left.trim().toLowerCase() === right.trim().toLowerCase();
}
