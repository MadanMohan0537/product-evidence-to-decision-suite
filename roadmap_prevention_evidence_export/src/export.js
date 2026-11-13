import {sha256} from '../../decision_provenance_pack/src/provenance.js';

/** Package recomputed assessments without copying free-text evidence or identities. */
export async function exportPreventionEvidence(recovery, plan, followthrough, current) {
  const lineage = ['sourceReportId', 'followupReportId'];
  for (const key of lineage) {
    if (typeof recovery?.[key] !== 'string' || !recovery[key] ||
      [plan, followthrough, current].some(stage => stage?.[key] !== recovery[key])) {
      throw new Error('Evidence stages must share recovery lineage');
    }
  }
  const actions = current.actions.map(({id, controlId, status, checkedAt}) => ({
    id, controlId, status, ...(checkedAt ? {checkedAt} : {}),
  }));
  const payload = {
    schemaVersion: '1.0.0', kind: 'roadmap_prevention_evidence_summary',
    sourceReportId: recovery.sourceReportId, followupReportId: recovery.followupReportId,
    asOf: current.asOf, maximumAgeHours: current.maximumAgeHours,
    stages: {recovery: recovery.status, plan: plan.status, followthrough: followthrough.status, revalidation: current.status},
    actions,
  };
  return {payload, integrity: {algorithm: 'SHA-256', digest: await sha256(payload)}};
}
