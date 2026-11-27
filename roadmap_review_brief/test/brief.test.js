import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReviewBrief as brief} from '../src/brief.js';
test('pending work stays visible with missing responsibility',()=>{
 const result=brief({controls:[{controlId:'a'}]});assert.equal(result.counts.pending,1);assert.equal(result.agenda[0].owner,null);
});
test('communication stop decisions stay counted but leave meeting agenda',()=>{
 const result=brief({controls:[{controlId:'a',disposition:{outcome:'no_further_communication'}}]});assert.equal(result.counts.no_further_communication,1);assert.equal(result.agenda.length,0);assert.equal(result.total,1);
});
test('preserves rationale, evidence and source without mutation',()=>{
 const report={sourceReportId:'s',controls:[{controlId:'a',reviewAssignment:{owner:'Ops',ticket:'T'},disposition:{outcome:'investigate',rationale:'Inspect',evidenceReference:'E'}}]};const before=JSON.stringify(report);const result=brief(report);assert.equal(result.agenda[0].evidenceReference,'E');assert.equal(result.sourceReportId,'s');assert.equal(JSON.stringify(report),before);
});
test('rejects unknown outcomes and handles empty work',()=>{
 assert.throws(()=>brief({controls:[{disposition:{outcome:'resolved'}}]}));assert.equal(brief({controls:[]}).total,0);
});
