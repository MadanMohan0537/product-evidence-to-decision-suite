import test from 'node:test';
import assert from 'node:assert/strict';
import {assessHandoff as assess} from '../src/handoff.js';
const assignment={owner:'Ops',ticket:'OPS-1'};
const source={asOf:'2027-01-01T00:00:00Z',controls:[{controlId:'archive',assignment}]};
const input={asOf:'2027-01-02T00:00:00Z',windowHours:12,receipts:[]};
const receipt={controlId:'archive',...assignment,acknowledgedAt:'2027-01-01T13:00:00Z'};
test('distinguishes pending and overdue',()=>{
  assert.equal(assess(source,input).controls[0].status,'overdue');
  assert.equal(assess(source,{...input,asOf:source.asOf}).controls[0].status,'pending');
});
test('records late acceptance without hiding lateness',()=>{
  const r=assess(source,{...input,receipts:[receipt]});
  assert.equal(r.status,'handoff_acknowledged');
  assert.equal(r.controls[0].status,'acknowledged_late');
});
test('rejects wrong owner and future receipt',()=>{
  for(const change of [{owner:'Other'},{acknowledgedAt:'2027-01-03T00:00:00Z'}])
    assert.throws(()=>assess(source,{...input,receipts:[{...receipt,...change}]}));
});
test('unassigned controls stay open; empty queue does not',()=>{
  assert.equal(assess({...source,controls:[{controlId:'archive',assignment:null}]},input).controls[0].status,'unassigned');
  assert.equal(assess({...source,controls:[]},input).status,'no_followup');
});
