/** Produce portable Markdown; quote untrusted labels rather than render links/HTML. */
const safe = value => String(value ?? 'Not recorded').replace(/[\r\n\t]+/g,' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([\\`*_{}\[\]()#+.!|~-])/g,'\\$1');
export function exportReviewBrief(brief) {
  const lines = ['# Communication review brief','',`Observation: ${safe(brief.asOf)}`,
    `Source report: ${safe(brief.sourceReportId)}`,`Follow-up report: ${safe(brief.followupReportId)}`,'',
    'This is meeting preparation, not proof of remediation.','', '## Outcome counts',''];
  for (const [outcome,count] of Object.entries(brief.counts)) {
    if (!Number.isInteger(count) || count < 0) throw new Error('Invalid outcome count');
    lines.push(`- ${safe(outcome)}: ${count}`);
  }
  lines.push('','## Agenda','');
  if (!brief.agenda.length) lines.push('No agenda items in this snapshot. This does not certify resolution.');
  for (const row of brief.agenda) {
    lines.push(`### Control: ${safe(row.controlId)}`,'',`- Owner: ${safe(row.owner)}`,
      `- Ticket: ${safe(row.ticket)}`,`- Outcome: ${safe(row.outcome)}`,
      `- Action: ${safe(row.action)}`,`- Rationale: ${safe(row.rationale)}`,
      `- Evidence reference: ${safe(row.evidenceReference)}`,'');
  }
  return {mediaType:'text/markdown',filename:'communication-review-brief.md',content:lines.join('\n')+'\n'};
}
