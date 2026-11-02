import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});


test("planning endpoint uses the supplied goal without provider keys", async()=>{
  process.env.DEEPSEEK_API_KEY="";process.env.ANTHROPIC_API_KEY="";
  const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url));
  const env={ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
  const ctx={waitUntil(){},passThroughOnException(){}};
  const response=await worker.fetch(new Request('http://localhost/api/ai/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:'Increase search result engagement',audience:'new desktop users',productArea:'Search'})}),env,ctx);
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.provider,'local-outline');assert.match(result.design.hypothesis,/search result engagement/);assert.match(result.design.hypothesis,/new desktop users/);
  const invalid=await worker.fetch(new Request('http://localhost/api/ai/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:'tiny'})}),env,ctx);
  assert.equal(invalid.status,400);
});
