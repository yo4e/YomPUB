import { test } from 'node:test';
import assert from 'node:assert/strict';

const manifest={horizontal:['book.md'],vertical:['book.md'],rtl:['book.md','assets/harbour.png']};

test('sample callers share the catalog and cancelling one cannot cancel another',async t=>{
  const {sampleFiles}=await import('../web/sample-files.mjs?shared-catalog-test');
  const calls=[],releases=[];
  t.mock.method(globalThis,'fetch',async(input,options={})=>{
    const url=String(input);calls.push({url,signal:options.signal});
    if(url.endsWith('samples/index.json'))return new Promise(resolve=>releases.push(()=>resolve(Response.json(manifest))));
    options.signal?.throwIfAborted();
    return new Response(url.endsWith('book.md')?'A book':'image');
  });
  const first=new AbortController(),second=new AbortController();
  const cancelled=assert.rejects(sampleFiles('horizontal',first.signal),{name:'AbortError'});
  const active=sampleFiles('rtl',second.signal);first.abort();
  for(const release of releases)release();
  await cancelled;const files=await active;
  assert.deepEqual(files.map(file=>file.path),['book.md','assets/harbour.png']);
  assert.equal(await files[0].file.text(),'A book');
  const catalogCalls=calls.filter(call=>call.url.endsWith('samples/index.json'));
  assert.equal(catalogCalls.length,1);assert.equal(catalogCalls[0].signal,undefined);
  assert.equal(calls.some(call=>call.url.includes('/horizontal/')),false);
  assert.ok(calls.filter(call=>call.url.includes('/rtl/')).every(call=>call.signal===second.signal));
});

test('failed catalogs can retry while manuscript acquisition still honors cancellation',async t=>{
  const {sampleFiles}=await import('../web/sample-files.mjs?catalog-retry-test');
  let catalogCalls=0,hold=true,started;
  const fileStarted=new Promise(resolve=>{started=resolve;});
  t.mock.method(globalThis,'fetch',async(input,options={})=>{
    if(String(input).endsWith('samples/index.json'))return ++catalogCalls===1?new Response('',{status:503}):Response.json(manifest);
    options.signal?.throwIfAborted();
    if(!hold)return new Response('Recovered');
    started();
    return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
  });
  await assert.rejects(sampleFiles('horizontal',new AbortController().signal),/Sample index: 503/);
  const controller=new AbortController();
  const cancelled=assert.rejects(sampleFiles('horizontal',controller.signal),{name:'AbortError'});
  await fileStarted;controller.abort();await cancelled;hold=false;
  const files=await sampleFiles('horizontal',new AbortController().signal);
  assert.equal(await files[0].file.text(),'Recovered');assert.equal(catalogCalls,2);
});
