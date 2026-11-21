import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeResponses as summarize} from '../src/summary.js';
test('empty denominators are not perfect coverage',()=>{
  const result=summarize({controls:[]});
  assert.equal(result.sendCoverage,null);assert.equal(result.responseCoverage,null);
});
test('keeps unsent and overdue work in appropriate denominators',()=>{
  const report={controls:['unrouted','not_recorded_sent','response_overdue','responded_late'].map(status=>({status}))};
  const result=summarize(report);
  assert.equal(result.sendCoverage,2/3);assert.equal(result.responseCoverage,.5);
  assert.equal(result.open,3);assert.equal(report.controls.length,4);
});
test('rejects unknown statuses',()=>assert.throws(()=>summarize({controls:[{status:'resolved'}]})));
