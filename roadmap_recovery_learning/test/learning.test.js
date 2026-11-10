import test from 'node:test';
import assert from 'node:assert/strict';
import {assessRecoveryLearning as assess} from '../src/learning.js';

const recovery={status:'recovery_evidence_complete',sourceReportId:'before',followupReportId:'after',restored:[{id:'archive',restored:true}]};
const action={id:'probe',controlId:'archive',owner:'Operations',measure:'Archive probe detects loss',dueAt:'2027-04-10T00:00:00Z'};
const plan={sourceReportId:'before',followupReportId:'after',asOf:'2027-04-09T00:00:00Z',lesson:'Detect archive loss earlier',actions:[action]};
test('complete plan is ready for human review',()=>assert.equal(assess(recovery,plan).status,'ready_for_human_review'));
test('missing action leaves the restored control uncovered',()=>assert.deepEqual(assess(recovery,{...plan,actions:[]}).uncovered,['archive']));
test('deadline at assessment time is overdue',()=>assert.equal(assess(recovery,{...plan,asOf:action.dueAt}).status,'needs_prevention_plan'));
test('wrong recovery or control lineage fails',()=>{
  assert.throws(()=>assess(recovery,{...plan,sourceReportId:'other'}),/lineage/);
  assert.throws(()=>assess(recovery,{...plan,actions:[{...action,controlId:'other'}]}),/restored-control/);
});
test('unverified recovery and duplicate actions fail',()=>{
  assert.throws(()=>assess({...recovery,status:'recovery_incomplete'},plan),/Verified/);
  assert.throws(()=>assess(recovery,{...plan,actions:[action,action]}),/Unique/);
});
