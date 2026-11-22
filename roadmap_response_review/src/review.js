/** Produce a read-only review queue from validated response rows. Never page. */
export function reviewResponses(report) {
  const priority = {unrouted:1,not_recorded_sent:2,response_overdue:3,awaiting_response:4,responded_late:5,responded:6};
  const reasons = {unrouted:'Assign a verified route',not_recorded_sent:'Check whether escalation was sent',response_overdue:'Follow up with the recorded contact',awaiting_response:'Wait until the response deadline',responded_late:'Review the late response',responded:'No communication follow-up indicated'};
  const controls = report.controls.map(row => {
    if (!Object.hasOwn(priority,row.status)) throw new Error('Unknown response status');
    return {controlId:row.controlId,status:row.status,priority:priority[row.status],action:reasons[row.status],dueAt:row.dueAt,route:row.route};
  }).filter(row=>row.status!=='responded').sort((a,b)=>a.priority-b.priority || (a.controlId < b.controlId ? -1 : a.controlId > b.controlId ? 1 : 0));
  return {sourceReportId:report.sourceReportId,followupReportId:report.followupReportId,asOf:report.asOf,controls,
    immediate:controls.filter(row=>row.priority<=3).length,
    warning:'Suggested human review only. No alert, notification, ticket or remediation is performed.'};
}
