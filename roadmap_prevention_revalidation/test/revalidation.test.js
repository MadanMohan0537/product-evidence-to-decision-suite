import test from 'node:test';
import assert from 'node:assert/strict';
import {revalidatePrevention} from '../src/revalidation.js';
const plan={sourceReportId:'s',followupReportId:'f',actions:[{id:'a',controlId:'archive',owner:'Ops',measure:'Probe reports loss'}]};
const check={actionId:'a',checkedAt:'2027-01-02T00:00:00Z',verifier:'QA',reference:'Probe log',measure:'Probe reports loss',passed:true};
const input={sourceReportId:'s',followupReportId:'f',asOf:'2027-01-03T00:00:00Z',maximumAgeHours:24,checks:[check]};
const run=(value=input,status='followthrough_verified')=>revalidatePrevention(plan,{status},'2027-01-01T00:00:00Z',value);
test('fresh check at age limit passes',()=>assert.equal(run().status,'prevention_checks_current'));
test('missing, stale and failed checks are distinct',()=>{
  assert.equal(run({...input,checks:[]}).actions[0].status,'missing');
  assert.equal(run({...input,maximumAgeHours:23}).actions[0].status,'stale');
  assert.equal(run({...input,checks:[{...check,passed:false}]}).actions[0].status,'failed');
});
test('requires verified follow-through and matching lineage',()=>{
  assert.throws(()=>run(input,'followthrough_open'),/Project 59/);
  assert.throws(()=>run({...input,sourceReportId:'other'}),/lineage/);
});
test('rejects reused old checks, self-review and substituted measures',()=>{
  assert.throws(()=>run({...input,checks:[{...check,checkedAt:'2027-01-01T00:00:00Z'}]}),/Check time/);
  for(const change of [{verifier:' ops '},{measure:'Other'}]) assert.throws(()=>run({...input,checks:[{...check,...change}]}),/Independent/);
});
