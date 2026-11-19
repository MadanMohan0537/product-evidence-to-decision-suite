import test from 'node:test';
import assert from 'node:assert/strict';
import {planEscalation as plan} from '../src/escalation.js';
const source={controls:[{controlId:'a',status:'overdue',assignment:{owner:'Ops',ticket:'T-1'}},{controlId:'b',status:'acknowledged_late',assignment:{owner:'Ops',ticket:'T-2'}}]};
const route={controlId:'a',contact:'Duty lead',channel:'Internal incident queue',runbook:'RB-1'};
test('drafts only eligible controls without contacting anyone',()=>{
  const result=plan(source,[route]);
  assert.equal(result.status,'ready_for_manual_escalation');
  assert.equal(result.drafts.length,1);
  assert.equal(result.drafts[0].ticket,'T-1');
});
test('unassigned and unrouted work stays visible',()=>{
  const result=plan({controls:[{controlId:'a',status:'unassigned',assignment:null}]},[]);
  assert.equal(result.unrouted,1);
  assert.equal(result.drafts[0].owner,null);
});
test('rejects duplicate and ineligible routes',()=>{
  assert.throws(()=>plan(source,[route,route]),/Unique/);
  assert.throws(()=>plan(source,[{...route,controlId:'b'}]),/Unique/);
});
test('pending or accepted work does not escalate',()=>{
  assert.equal(plan({controls:[{controlId:'a',status:'pending'}]},[]).status,'no_escalation');
});
