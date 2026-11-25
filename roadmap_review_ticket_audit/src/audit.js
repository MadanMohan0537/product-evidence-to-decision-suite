/** Flag shared tracking references for human inspection, not automatic rejection. */
export function auditReviewTickets(report) {
  const tickets = new Map();
  let unassigned = 0;
  for (const row of report.controls) {
    if (!row.reviewAssignment) { unassigned++; continue; }
    const {ticket, owner} = row.reviewAssignment;
    if (!tickets.has(ticket)) tickets.set(ticket, []);
    tickets.get(ticket).push({controlId:row.controlId,owner});
  }
  const shared = [...tickets].filter(([,rows])=>rows.length>1).map(([ticket,controls])=>({
    ticket,controls,owners:[...new Set(controls.map(row=>row.owner))].sort(),
    crossOwner:new Set(controls.map(row=>row.owner)).size>1,
  })).sort((a,b)=>a.ticket < b.ticket ? -1 : a.ticket > b.ticket ? 1 : 0);
  return {sourceReportId:report.sourceReportId,followupReportId:report.followupReportId,asOf:report.asOf,
    distinctTickets:tickets.size,unassigned,shared,
    status:shared.length?'inspect_shared_tracking':'no_shared_tracking_detected',
    warning:'Shared references may be intentional parent tickets. No ticket is fetched, changed or certified.'};
}
