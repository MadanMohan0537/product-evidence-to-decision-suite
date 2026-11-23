import test from 'node:test';
import assert from 'node:assert/strict';
import {assignReviews as assign} from '../src/assignments.js';
const queue={sourceReportId:'s',controls:[{controlId:'a',action:'Follow up'}]};
test('unassigned work remains visible',()=>assert.equal(assign(queue).unassigned,1));
test('records explicit responsibility without mutating source',()=>{
 const result=assign(queue,[{controlId:'a',owner:' Ops ',ticket:'T-1'}]);
 assert.equal(result.status,'review_ownership_recorded');assert.equal(result.controls[0].reviewAssignment.owner,'Ops');assert.equal(queue.controls[0].reviewAssignment,undefined);assert.equal(result.sourceReportId,'s');
});
test('rejects unknown controls, duplicates and blank fields',()=>{
 for(const item of [{controlId:'b',owner:'Ops',ticket:'T'},{controlId:'a',owner:' ',ticket:'T'},{controlId:'a',owner:'Ops',ticket:''}])assert.throws(()=>assign(queue,[item]));
 assert.throws(()=>assign(queue,[{controlId:'a'},{controlId:'a'}]));
});
test('empty queue does not demand assignments',()=>assert.equal(assign({controls:[]}).status,'no_review_work'));
