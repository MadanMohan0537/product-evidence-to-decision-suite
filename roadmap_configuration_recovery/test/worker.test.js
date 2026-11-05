import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const request=(options={})=>new Request('https://example.test/api/configuration-recovery',options);
test('requires configured authentication',async()=>{
  assert.equal((await worker.fetch(request(),{})).status,503);
  assert.equal((await worker.fetch(request(),{API_TOKEN:'test'})).status,401);
});
test('rejects cross-origin requests',async()=>assert.equal((await worker.fetch(request({headers:{Origin:'https://other.test'}}),{API_TOKEN:'test'})).status,403));
test('validates content type',async()=>assert.equal((await worker.fetch(request({method:'POST',headers:{Authorization:'Bearer test'},body:'{}'}),{API_TOKEN:'test'})).status,415));
test('rejects malformed reports',async()=>assert.equal((await worker.fetch(request({method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:'{}'}),{API_TOKEN:'test'})).status,422));
