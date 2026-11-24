/** Count asserted review work by owner; never infer actual team capacity. */
export function summarizeReviewLoad(report) {
  const owners = new Map();
  let unassigned = 0;
  for (const row of report.controls) {
    if (!row.reviewAssignment) { unassigned++; continue; }
    const {owner, ticket} = row.reviewAssignment;
    if (typeof owner !== 'string' || !owner.trim() || typeof ticket !== 'string' || !ticket.trim()) throw new Error('Invalid review assignment');
    if (!owners.has(owner)) owners.set(owner, {owner,controls:[],immediate:0});
    const group = owners.get(owner);
    group.controls.push({controlId:row.controlId,ticket,status:row.status});
    if (row.priority <= 3) group.immediate++;
  }
  const groups = [...owners.values()].map(group => ({...group,count:group.controls.length}));
  groups.sort((a,b) => b.immediate-a.immediate || b.count-a.count || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0));
  return {sourceReportId:report.sourceReportId,followupReportId:report.followupReportId,asOf:report.asOf,
    owners:groups,unassigned,total:report.controls.length,
    assignmentCoverage:report.controls.length ? (report.controls.length-unassigned)/report.controls.length : null,
    warning:'Counts are declared review assignments, not effort estimates, capacity or remediation.'};
}
