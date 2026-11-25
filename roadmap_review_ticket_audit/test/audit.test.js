import test from 'node:test';
import assert from 'node:assert/strict';
import {auditReviewTickets as audit} from '../src/audit.js';
const row=(controlId,owner,ticket)=>({controlId,reviewAssignment:{owner,ticket}});
test('detects cross-owner shared tracking without dropping controls',()=>{
 const result=audit({sourceReportId:'s',controls:[row('a','Ops','T'),row('b','PM','T')]});assert.equal(result.shared[0].crossOwner,true);assert.equal(result.shared[0].controls.length,2);assert.equal(result.sourceReportId,'s');
});
test('same-owner parent tickets remain reviewable, not invalid',()=>{
 assert.equal(audit({controls:[row('a','Ops','T'),row('b','Ops','T')]}).shared[0].crossOwner,false);
});
test('missing and empty queues do not imply completed tracking',()=>{
 assert.equal(audit({controls:[{controlId:'a'}]}).unassigned,1);assert.equal(audit({controls:[]}).distinctTickets,0);
});
test('unique references preserve source without mutation',()=>{
 const report={controls:[row('a','Ops','T1'),row('b','PM','T2')]};const before=JSON.stringify(report);assert.equal(audit(report).shared.length,0);assert.equal(JSON.stringify(report),before);
});
