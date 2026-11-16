const policies = {
  failed: {rank:0, priority:'high', next:'Investigate the failed prevention measure.'},
  missing: {rank:1, priority:'medium', next:'Collect a repeat check against the original measure.'},
  stale: {rank:2, priority:'medium', next:'Refresh the expired repeat check.'},
};

/** Group an already verified Project 63 comparison into a read-only review queue. */
export function prioritizePreventionReview(comparison, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be 1–100');
  const controls = new Map();
  for (const row of comparison.actions) {
    if (row.latest === 'current') continue;
    const policy = policies[row.latest];
    const action = {id:row.id,status:row.latest,change:row.change,next:policy.next};
    const group = controls.get(row.controlId) ?? {controlId:row.controlId,rank:policy.rank,actions:[]};
    group.rank = Math.min(group.rank, policy.rank);
    group.actions.push(action);
    controls.set(row.controlId, group);
  }
  const sorted = [...controls.values()].sort((a,b) => a.rank-b.rank || (a.controlId < b.controlId ? -1 : a.controlId > b.controlId ? 1 : 0));
  return {
    sourceReportId:comparison.sourceReportId, followupReportId:comparison.followupReportId,
    asOf:comparison.latestAsOf, totalControls:sorted.length, omittedControls:Math.max(0,sorted.length-limit),
    queue:sorted.slice(0,limit).map(({rank,...group}) => ({...group,priority:rank===0?'high':'medium'})),
  };
}
