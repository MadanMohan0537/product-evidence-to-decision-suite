import test from 'node:test';
import assert from 'node:assert/strict';
import {prioritizePreventionReview as triage} from '../src/triage.js';
const row=(id,controlId,latest,change='unchanged')=>({id,controlId,latest,change});
test('groups by control and prioritizes failures over missing and stale checks',()=>{
  const result=triage({actions:[row('a','one','stale'),row('b','two','missing'),row('c','three','failed'),row('d','one','missing')]},2);
  assert.deepEqual(result.queue.map(item=>item.controlId),['three','one']);
  assert.equal(result.queue[1].actions.length,2);
  assert.equal(result.omittedControls,1);
});
test('resolved actions are excluded but unchanged failures remain reviewable',()=>{
  const result=triage({actions:[row('a','one','current','became_current'),row('b','one','failed')]});
  assert.deepEqual(result.queue[0].actions.map(item=>item.id),['b']);
});
test('empty queue and invalid bounds',()=>{
  assert.deepEqual(triage({actions:[]}).queue,[]);
  assert.throws(()=>triage({actions:[]},0),/limit/);
});
