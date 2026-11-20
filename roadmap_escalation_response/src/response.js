function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) throw new Error('Use UTC ISO timestamps');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== value.replace('.000Z', 'Z')) throw new Error('Invalid timestamp');
  return time;
}

const label = value => typeof value === 'string' && Boolean(value.trim()) && value.length <= 200;

/** Assess manually recorded communication, never delivery or remediation itself. */
export function monitorResponses(escalation, input) {
  const start = instant(escalation.asOf);
  const end = instant(input?.asOf);
  const hours = input.responseWindowHours;
  if (end < start || !Number.isInteger(hours) || hours < 1 || hours > 720) throw new Error('Invalid observation time or response window');
  if (!Array.isArray(input.receipts) || input.receipts.length > escalation.drafts.length) throw new Error('Invalid receipts');
  const targets = new Map(escalation.drafts.map(draft => [draft.controlId, draft]));
  const receipts = new Map();
  for (const receipt of input.receipts) {
    const draft = targets.get(receipt?.controlId);
    if (!draft?.route || receipts.has(receipt.controlId) ||
        ['contact', 'channel', 'runbook'].some(key => receipt[key] !== draft.route[key]) ||
        !label(receipt.reference)) throw new Error('Receipt must uniquely match a routed draft and include a reference');
    const sent = instant(receipt.sentAt);
    if (sent < start || sent > end) throw new Error('Send time outside observation interval');
    let responded = null;
    if (receipt.response !== undefined) {
      if (!receipt.response || !label(receipt.response.reference) || receipt.response.contact !== draft.route.contact) throw new Error('Response must match contact and include a reference');
      responded = instant(receipt.response.at);
      if (responded < sent || responded > end) throw new Error('Response time outside send/observation interval');
    }
    receipts.set(receipt.controlId, {receipt, sent, responded});
  }
  const controls = escalation.drafts.map(draft => {
    const record = receipts.get(draft.controlId);
    const deadline = record ? record.sent + hours * 3_600_000 : null;
    const status = !draft.route ? 'unrouted' : !record ? 'not_recorded_sent' :
      record.responded !== null ? (record.responded > deadline ? 'responded_late' : 'responded') :
      end >= deadline ? 'response_overdue' : 'awaiting_response';
    return {...draft, status, dueAt: deadline === null ? null : new Date(deadline).toISOString(),
      receipt: record?.receipt ?? null};
  });
  const open = controls.filter(row => !['responded', 'responded_late'].includes(row.status)).length;
  return {sourceReportId: escalation.sourceReportId, followupReportId: escalation.followupReportId,
    asOf: input.asOf, responseWindowHours: hours, controls, open,
    status: !controls.length ? 'no_escalation' : open ? 'response_followup_required' : 'responses_recorded'};
}
