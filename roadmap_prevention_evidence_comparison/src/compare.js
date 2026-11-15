import {verifyPreventionEvidence} from '../../roadmap_prevention_evidence_verification/src/verify.js';

const statuses = new Set(['current', 'missing', 'failed', 'stale']);
function index(payload) {
  if (!Array.isArray(payload.actions) || !payload.actions.length || payload.actions.length > 100) {
    throw new Error('Expected 1–100 exported actions');
  }
  const actions = new Map();
  for (const action of payload.actions) {
    if (typeof action?.id !== 'string' || !action.id.trim() || actions.has(action.id) ||
        typeof action.controlId !== 'string' || !action.controlId.trim() || !statuses.has(action.status)) {
      throw new Error('Invalid or duplicate exported action');
    }
    actions.set(action.id, action);
  }
  return actions;
}

/** Compare snapshots of the same recovery under the same freshness policy. */
export async function comparePreventionEvidence(previous, latest) {
  const results = await Promise.all([previous, latest].map(entry =>
    verifyPreventionEvidence(entry?.envelope, entry?.expectedDigest)));
  if (results.some(result => result.status !== 'digest_match')) throw new Error('Both exports must match their trusted digests');
  const before = previous.envelope.payload;
  const after = latest.envelope.payload;
  for (const key of ['sourceReportId', 'followupReportId']) {
    if (typeof before[key] !== 'string' || !before[key].trim() || before[key] !== after[key]) throw new Error('Recovery lineage mismatch');
  }
  if (!(Date.parse(after.asOf) > Date.parse(before.asOf))) throw new Error('Latest export must be newer');
  if (!Number.isInteger(before.maximumAgeHours) || before.maximumAgeHours < 1 ||
      before.maximumAgeHours > 2160 || before.maximumAgeHours !== after.maximumAgeHours) throw new Error('Freshness policies must match');
  const oldActions = index(before);
  const newActions = index(after);
  if (oldActions.size !== newActions.size) throw new Error('Action scope mismatch');
  const rows = [...oldActions.keys()].sort().map(id => {
    const old = oldActions.get(id);
    const next = newActions.get(id);
    if (old.controlId !== next?.controlId) throw new Error('Action scope mismatch');
    const change = old.status === next.status ? 'unchanged' :
      next.status === 'current' ? 'became_current' : old.status === 'current' ? 'lost_currency' : 'changed_noncurrent';
    return {id, controlId:old.controlId, previous:old.status, latest:next.status, change};
  });
  return {sourceReportId:before.sourceReportId, followupReportId:before.followupReportId,
    previousAsOf:before.asOf, latestAsOf:after.asOf, maximumAgeHours:before.maximumAgeHours, actions:rows};
}
