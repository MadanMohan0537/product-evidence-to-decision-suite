import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../../decision_provenance_pack/src/provenance.js';
import {comparePreventionEvidence as compare} from '../src/compare.js';
const base={schemaVersion:'1.0.0',kind:'roadmap_prevention_evidence_summary',sourceReportId:'s',followupReportId:'f',
  maximumAgeHours:24,asOf:'2027-01-01T00:00:00Z',actions:[{id:'a',controlId:'archive',status:'current'}]};
async function wrap(payload) {
  const digest=await sha256(payload);
  return {envelope:{payload,integrity:{algorithm:'SHA-256',digest}},expectedDigest:digest};
}
const later={...base,asOf:'2027-01-02T00:00:00Z'};
test('reports loss and restoration of currency',async()=>{
  const stale={...base.actions[0],status:'stale'};
  assert.equal((await compare(await wrap(base),await wrap({...later,actions:[stale]}))).actions[0].change,'lost_currency');
  assert.equal((await compare(await wrap({...base,actions:[stale]}),await wrap(later))).actions[0].change,'became_current');
});
test('rejects changed policy, lineage, date and scope',async()=>{
  const first=await wrap(base);
  for (const [change,error] of [[{maximumAgeHours:48},/polic/],[{sourceReportId:'other'},/lineage/],
    [{asOf:base.asOf},/newer/],[{actions:[{...base.actions[0],controlId:'other'}]},/scope/]]) {
    await assert.rejects(compare(first,await wrap({...later,...change})),error);
  }
});
test('rejects a replaced trusted digest and duplicate actions',async()=>{
  const first=await wrap(base);
  await assert.rejects(compare(first,{...await wrap(later),expectedDigest:first.expectedDigest}),/trusted digests/);
  await assert.rejects(compare(first,await wrap({...later,actions:[...base.actions,...base.actions]})),/duplicate/);
});
