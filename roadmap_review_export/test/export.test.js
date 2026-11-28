import test from 'node:test';
import assert from 'node:assert/strict';
import {exportReviewBrief as exportBrief} from '../src/export.js';
const brief={sourceReportId:'s',counts:{pending:1},agenda:[{controlId:'a',owner:null,outcome:'pending'}]};
test('exports portable content and missing fields explicitly',()=>{
 const result=exportBrief(brief);assert.equal(result.mediaType,'text/markdown');assert.match(result.content,/Not recorded/);assert.match(result.content,/Source report: s/);
});
test('escapes malicious markup and line injection',()=>{
 const result=exportBrief({...brief,agenda:[{controlId:'<script>\n# injected',owner:'[click](https://bad.test)'}]});assert.ok(!result.content.includes('<script>'));assert.ok(!result.content.includes('\n# injected'));assert.ok(!result.content.includes('[click]('));
});
test('empty agenda does not claim remediation',()=>assert.match(exportBrief({...brief,agenda:[]}).content,/does not certify resolution/));
test('rejects invalid counts and leaves input intact',()=>{
 assert.throws(()=>exportBrief({...brief,counts:{pending:-1}}));const before=JSON.stringify(brief);assert.deepEqual(exportBrief(brief),exportBrief(brief));assert.equal(JSON.stringify(brief),before);
});
