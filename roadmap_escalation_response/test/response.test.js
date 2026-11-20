import test from 'node:test';
import assert from 'node:assert/strict';
import {monitorResponses as assess} from '../src/response.js';
const route = {contact:'Lead', channel:'Queue', runbook:'RB-1'};
const source = {sourceReportId:'old', followupReportId:'new', asOf:'2027-04-16T00:00:00Z', drafts:[{controlId:'a', route}]};
const receipt = {controlId:'a', ...route, reference:'MSG-1', sentAt:'2027-04-16T01:00:00Z'};
const input = {asOf:'2027-04-16T05:00:00Z', responseWindowHours:4, receipts:[receipt]};
test('deadline is inclusive and does not resolve the underlying control', () => {
  const result = assess(source, input);
  assert.equal(result.controls[0].status, 'response_overdue');
  assert.equal(result.open, 1);
  assert.equal(result.sourceReportId, 'old');
  assert.equal(assess(source, {...input, asOf:'2027-04-16T04:59:59Z'}).controls[0].status, 'awaiting_response');
});
test('preserves unsent and unrouted gaps', () => {
  assert.equal(assess(source, {...input, receipts:[]}).controls[0].status, 'not_recorded_sent');
  assert.equal(assess({...source, drafts:[{controlId:'a', route:null}]}, {...input, receipts:[]}).controls[0].status, 'unrouted');
});
test('records timely and late replies distinctly', () => {
  for (const [at, status] of [['2027-04-16T05:00:00Z','responded'], ['2027-04-16T05:00:01Z','responded_late']]) {
    const result = assess(source, {...input, asOf:'2027-04-16T06:00:00Z', receipts:[{...receipt, response:{contact:'Lead', reference:'REPLY-1', at}}]});
    assert.equal(result.controls[0].status, status);
    assert.equal(result.status, 'responses_recorded');
  }
});
test('rejects mismatched routes, controls, and duplicate receipts', () => {
  for (const patch of [{controlId:'x'}, {contact:'Other'}, {channel:'Other'}, {runbook:'Other'}, {reference:''}]) {
    assert.throws(() => assess(source, {...input, receipts:[{...receipt, ...patch}]}));
  }
  assert.throws(() => assess(source, {...input, receipts:[receipt, receipt]}));
});
test('rejects future, pre-send and impossible timestamps', () => {
  for (const at of ['2027-02-30T00:00:00Z','2027-04-16T00:00:00Z','2027-04-16T06:00:00Z']) {
    assert.throws(() => assess(source, {...input, receipts:[{...receipt, response:{contact:'Lead', reference:'R', at}}]}));
  }
  assert.throws(() => assess(source, {...input, receipts:[{...receipt, sentAt:'2027-04-15T00:00:00Z'}]}));
});
test('validates policy and empty input', () => {
  for (const responseWindowHours of [0, 721, 1.5, '4']) assert.throws(() => assess(source, {...input, responseWindowHours}));
  assert.throws(() => assess(source, {...input, asOf:'2027-04-15T00:00:00Z'}));
  assert.equal(assess({...source, drafts:[]}, {...input, receipts:[]}).status, 'no_escalation');
});
test('does not mutate inputs and is deterministic', () => {
  const before = JSON.stringify({source, input});
  assert.deepEqual(assess(source, input), assess(source, input));
  assert.equal(JSON.stringify({source, input}), before);
});
