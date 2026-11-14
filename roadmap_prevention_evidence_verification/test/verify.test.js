import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../../decision_provenance_pack/src/provenance.js';
import {verifyPreventionEvidence as verify} from '../src/verify.js';
const payload={kind:'roadmap_prevention_evidence_summary',schemaVersion:'1.0.0',stages:{revalidation:'review_required'}};
const digest=await sha256(payload);
const envelope={payload,integrity:{algorithm:'SHA-256',digest}};
test('matching export and trusted digest pass',async()=>assert.equal((await verify(envelope,digest.toUpperCase())).status,'digest_match'));
test('rechksumming a changed export cannot satisfy the original trusted digest', async()=>{
  const changed={...payload,stages:{revalidation:'prevention_checks_current'}};
  const result=await verify({payload:changed,integrity:{algorithm:'SHA-256',digest:await sha256(changed)}},digest);
  assert.equal(result.embeddedMatches,true);
  assert.equal(result.trustedMatches,false);
  assert.equal(result.status,'digest_mismatch');
});
test('missing independent digest and malformed envelope fail',async()=>{
  await assert.rejects(verify(envelope),/trusted/);
  await assert.rejects(verify({...envelope,integrity:null},digest),/checksum/);
});
test('rejects oversized nesting before canonicalization',async()=>{
  let nested=null;
  for(let i=0;i<15;i++) nested={nested};
  await assert.rejects(verify({...envelope,payload:{...payload,nested}},digest),/complexity/);
});
