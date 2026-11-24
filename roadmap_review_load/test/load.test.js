import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeReviewLoad as summarize} from '../src/load.js';
test('empty input has undefined coverage',()=>assert.equal(summarize({controls:[]}).assignmentCoverage,null));
test('unassigned work stays in denominator',()=>{
 const result=summarize({controls:[{reviewAssignment:null},{controlId:'a',priority:1,reviewAssignment:{owner:'Ops',ticket:'T'}}]});assert.equal(result.assignmentCoverage,.5);assert.equal(result.unassigned,1);assert.equal(result.owners[0].immediate,1);
});
test('groups owners without merging their tickets or mutating input',()=>{
 const report={sourceReportId:'s',controls:[1,2].map(i=>({controlId:String(i),priority:4,reviewAssignment:{owner:'Ops',ticket:'T'}}))};const before=JSON.stringify(report);const result=summarize(report);assert.equal(result.owners[0].count,2);assert.equal(result.sourceReportId,'s');assert.equal(JSON.stringify(report),before);
});
test('rejects invalid assignment labels',()=>assert.throws(()=>summarize({controls:[{reviewAssignment:{owner:'',ticket:'T'}}]})));
