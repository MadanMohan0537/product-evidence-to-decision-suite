import test from 'node:test';
import assert from 'node:assert/strict';
import {exportPreventionEvidence as pack} from '../src/export.js';
import {sha256} from '../../decision_provenance_pack/src/provenance.js';
const ids={sourceReportId:'before',followupReportId:'after'};
const recovery={...ids,status:'recovery_evidence_complete'};
const plan={...ids,status:'ready_for_human_review',lesson:'Private notes'};
const verified={...ids,status:'followthrough_verified'};
const current={...ids,status:'review_required',asOf:'2027-01-02T00:00:00Z',maximumAgeHours:24,
  actions:[{id:'probe',controlId:'archive',status:'stale',reference:'Private receipt',verifier:'Private person'}]};
test('exports deterministic integrity and preserves nonpassing state',async()=>{
  const result=await pack(recovery,plan,verified,current);
  assert.deepEqual(result,await pack(recovery,plan,verified,current));
  assert.equal(result.payload.stages.revalidation,'review_required');
  assert.equal(result.integrity.digest,await sha256(result.payload));
  assert.notEqual(result.integrity.digest,await sha256({...result.payload,maximumAgeHours:12}));
});
test('excludes free text and identities',async()=>{
  const result=await pack(recovery,plan,verified,current);
  assert.deepEqual(result.payload.actions,[{id:'probe',controlId:'archive',status:'stale'}]);
  assert.doesNotMatch(JSON.stringify(result),/Private/);
});
test('rejects mixed lineage',async()=>assert.rejects(pack(recovery,plan,verified,{...current,sourceReportId:'other'}),/lineage/));
