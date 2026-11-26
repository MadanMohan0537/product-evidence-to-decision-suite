import test from 'node:test';
import assert from 'node:assert/strict';
import {assessReviewDispositions as assess} from '../src/disposition.js';
const report={sourceReportId:'s',controls:[{controlId:'a',reviewAssignment:{owner:'Ops',ticket:'T'}}]};
const decision={controlId:'a',owner:'Ops',ticket:'T',outcome:'investigate',rationale:'Inspect the missing reply',evidenceReference:'MSG-1'};
test('missing decisions remain pending',()=>assert.equal(assess(report).pending,1));
test('records explicit outcomes without mutating or resolving controls',()=>{
 const result=assess(report,[decision]);assert.equal(result.pending,0);assert.equal(result.controls[0].disposition.outcome,'investigate');assert.equal(result.sourceReportId,'s');assert.equal(report.controls[0].disposition,undefined);
});
test('rejects mismatched responsibility and unsupported outcomes',()=>{
 for(const patch of [{owner:'Other'},{ticket:'Other'},{controlId:'x'},{outcome:'resolved'},{rationale:''},{evidenceReference:''}])assert.throws(()=>assess(report,[{...decision,...patch}]));
 assert.throws(()=>assess(report,[decision,decision]));assert.throws(()=>assess({controls:[{controlId:'a'}]},[decision]));
});
test('empty review does not require outcomes',()=>assert.equal(assess({controls:[]}).status,'no_review_work'));
