import test from 'node:test';
import assert from 'node:assert/strict';
import {assessPreventionOwnership as assess} from '../src/ownership.js';
const queue={omittedControls:0,queue:[{controlId:'archive'},{controlId:'rollback'}]};
const item={controlId:'archive',owner:'Operations',ticket:'OPS-1'};
test('reports missing ownership without hiding controls',()=>{
  const result=assess(queue,[item]);
  assert.equal(result.status,'ownership_incomplete');
  assert.equal(result.controls[1].assignment,null);
});
test('distinct valid assignments enable handoff',()=>assert.equal(assess(queue,[item,{...item,controlId:'rollback',ticket:'OPS-2'}]).status,'ready_for_handoff'));
test('rejects duplicate, unknown and blank records',()=>{
  for(const assignments of [[item,item],[{...item,controlId:'other'}],[{...item,owner:' '}],[item,{...item,controlId:'rollback'}]]) assert.throws(()=>assess(queue,assignments));
});
test('rejects truncated queues and distinguishes no follow-up',()=>{
  assert.throws(()=>assess({...queue,omittedControls:1},[]),/Complete/);
  assert.equal(assess({...queue,queue:[]},[]).status,'no_followup');
});
