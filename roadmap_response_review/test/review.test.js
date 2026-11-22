import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewResponses as review} from '../src/review.js';
test('separates immediate gaps from waiting and late review',()=>{
 const source={controls:['responded','awaiting_response','response_overdue','unrouted','responded_late','not_recorded_sent'].map((status,i)=>({controlId:String(i),status}))};
 const result=review(source);assert.equal(result.immediate,3);assert.equal(result.controls.length,5);assert.equal(result.controls[0].status,'unrouted');assert.equal(source.controls.length,6);
});
test('empty report has no review work',()=>assert.equal(review({controls:[]}).immediate,0));
test('unknown statuses fail closed',()=>assert.throws(()=>review({controls:[{status:'fixed'}]})));
test('stable ties retain explicit identifiers and lineage',()=>{
 const result=review({sourceReportId:'s',controls:[{controlId:'z',status:'unrouted'},{controlId:'a',status:'unrouted'}]});assert.deepEqual(result.controls.map(x=>x.controlId),['a','z']);assert.equal(result.sourceReportId,'s');
});
