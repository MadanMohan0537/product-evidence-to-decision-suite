/** Verify restoration of originally failed controls; never execute remediation. */
export function verifyConfigurationRecovery(source, followup, actions) {
  if (!source || !followup || !Array.isArray(source.checks) || !Array.isArray(followup.checks)) throw new Error('Two monitoring reports required');
  if (source.schemaVersion !== '1.0.0' || followup.schemaVersion !== '1.0.0') throw new Error('Unsupported report schema');
  if (!source.id || !followup.id || source.id === followup.id) throw new Error('Distinct report IDs required');
  if (!Number.isFinite(Date.parse(source.asOf)) || !Number.isFinite(Date.parse(followup.asOf)) || Date.parse(followup.asOf) <= Date.parse(source.asOf)) throw new Error('Follow-up must be later');
  for (const key of ['sourceHandoffId', 'activeVersion', 'factorManifestId']) {
    if (!source[key] || source[key] !== followup[key]) throw new Error(`Changed ${key}`);
  }
  if (!Array.isArray(actions) || actions.length > 100) throw new Error('Bounded actions required');
  const failed = source.checks.filter(item => item.passed === false).map(item => item.id);
  if (!failed.length) throw new Error('Source must contain failed controls');
  const seen = new Set();
  for (const action of actions) {
    if (!action.id || seen.has(action.id)) throw new Error('Unique action IDs required');
    seen.add(action.id);
    if (!action.owner?.trim() || !action.evidence?.trim() || !failed.includes(action.controlId)) throw new Error('Owned evidence-linked actions required');
  }
  const restored = failed.map(id => ({id, restored: followup.checks.some(item => item.id === id && item.passed === true) && actions.some(action => action.controlId === id && action.status === 'completed')}));
  return {schemaVersion: '1.0.0', sourceReportId: source.id, followupReportId: followup.id, restored, status: restored.every(item => item.restored) && followup.checks.every(item => item.passed === true) ? 'recovery_evidence_complete' : 'recovery_incomplete'};
}
