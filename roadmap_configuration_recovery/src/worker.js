import {verifyConfigurationRecovery} from './recovery.js';

const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (value, status=200) => Response.json(value,{status,headers});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : json({error:'Assets unavailable'},503);
    if (url.pathname === '/api/health') return json({configured:Boolean(env.API_TOKEN)});
    if (!env.API_TOKEN) return json({error:'API_TOKEN required'},503);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({error:'Cross-origin request rejected'},403);
    const digest = value => crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    const [actual,expected] = await Promise.all([digest(request.headers.get('Authorization') || ''),digest(`Bearer ${env.API_TOKEN}`)]);
    const a = new Uint8Array(actual), b = new Uint8Array(expected);
    let difference = 0;
    for (let i=0;i<a.length;i++) difference |= a[i]^b[i];
    if (difference) return json({error:'Unauthorized'},401);
    if (url.pathname !== '/api/configuration-recovery' || request.method !== 'POST') return json({error:'Not found'},404);
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return json({error:'Use application/json'},415);
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({error:'Body required'},422);
      const chunks=[];
      let size=0;
      while (true) {
        const {done,value}=await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size>2_000_000) {await reader.cancel();return json({error:'Request exceeds 2 MB'},413);}
        chunks.push(value);
      }
      const bytes=new Uint8Array(size);
      let offset=0;
      for (const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
      const payload=JSON.parse(new TextDecoder().decode(bytes));
      return json(verifyConfigurationRecovery(payload.source,payload.followup,payload.actions));
    } catch (error) {
      return json({error:error.message},422);
    }
  }
};
