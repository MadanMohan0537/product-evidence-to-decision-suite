import assert from 'node:assert/strict';
import test from 'node:test';
import {analyze,sampleSize,validateDraft} from '../lib/experiment-engine.ts';
const good={controlVisitors:10000,controlConversions:1000,treatmentVisitors:10000,treatmentConversions:1400};
test('sample planning rejects impossible targets',()=>{assert(sampleSize(.1,.2)>3000);for(const p of [0,1,-.1])assert.throws(()=>sampleSize(p,.2));assert.throws(()=>sampleSize(.9,.5));});
test('positive result with sufficient sample and guardrails ships',()=>{const r=analyze(good,[{name:'Error rate',control:1,treatment:1,maxRegression:.2,direction:'lower'}],.1,.2);assert.equal(r.recommendation,'Ship');assert(r.pValue<.001);assert(Math.abs(r.absoluteLift-.04)<1e-12);assert(r.confidenceInterval95[0]>0);});
test('guardrail failure overrides lift',()=>{assert.equal(analyze(good,[{name:'Latency',control:600,treatment:800,maxRegression:100,direction:'lower'}],.1,.2).recommendation,'Rollback');});
test('low sample and sparse outcomes hold',()=>{assert.equal(analyze({...good,controlVisitors:100,treatmentVisitors:100,controlConversions:10,treatmentConversions:14},[],.1,.2).recommendation,'Hold');assert.equal(analyze({...good,controlConversions:1},[],.1,.2).pValue,null);});
test('sample ratio mismatch holds',()=>{assert.equal(analyze({...good,treatmentVisitors:20000},[],.1,.2).recommendation,'Hold');});
test('negative meaningful result rolls back',()=>{assert.equal(analyze({...good,treatmentConversions:700},[],.1,.2).recommendation,'Rollback');});
test('zero difference is not significant',()=>{const r=analyze({...good,treatmentConversions:1000},[],.1,.2);assert.equal(r.recommendation,'Iterate');assert(Math.abs(r.pValue-1)<1e-6);});
test('invalid counts and guardrails reject',()=>{assert.throws(()=>analyze({...good,controlConversions:20000},[],.1,.2));assert.throws(()=>analyze({...good,controlVisitors:1.5},[],.1,.2));assert.throws(()=>analyze(good,[{name:'',control:0,treatment:0,maxRegression:1,direction:'lower'}],.1,.2));});
test('empty results await evidence',()=>{assert.equal(analyze({controlVisitors:0,controlConversions:0,treatmentVisitors:0,treatmentConversions:0},[],.1,.2).status,'Awaiting results');});
test('draft import validates measurement and decisions',()=>{const d={id:'test',name:'Checkout',hypothesis:'Fewer steps increase conversion',audience:'new users',metric:'conversion',baseline:.1,mde:.2,counts:good,guardrails:[],decision:'Pending',rollout:0,createdAt:'2026-01-01T00:00:00Z'};assert.equal(validateDraft(d).id,'test');assert.throws(()=>validateDraft({...d,decision:'Automatically deployed'}));assert.throws(()=>validateDraft({...d,rollout:101}));});

test("positive primary evidence without guardrails holds",()=>{assert.equal(analyze(good,[],.1,.2).recommendation,"Hold");});
