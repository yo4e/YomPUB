import { test, expect } from '@playwright/test';
const header='---\nyompub: 0.1-draft.1\ntitle: Host book\nlang: en\n---\n# Start\n\n';
const mount=(page,name)=>page.locator(`#mount-${name}`);
async function openDemo(page) {
  await page.goto('./embed.html');
  for(const [name,title] of [['one','The Small Harbour'],['two','月の港'],['three','ضوء الميناء']]) await expect(mount(page,name).locator('#status')).toContainText(`${title} を開きました`);
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    window.resources={urls:new Set(),workers:new Set(),errors:[]};
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),NativeWorker=window.Worker;
    URL.createObjectURL=blob=>{const url=create(blob);window.resources.urls.add(url);return url;};
    URL.revokeObjectURL=url=>{window.resources.urls.delete(url);revoke(url);};
    window.Worker=class extends NativeWorker {constructor(...args){super(...args);window.resources.workers.add(this);}terminate(){window.resources.workers.delete(this);super.terminate();}};
    window.addEventListener('error',event=>window.resources.errors.push(event.message));
  });
  await openDemo(page);
});

test('host styles, independent settings and container dimensions',async({page},info)=>{
  const hostState=()=>({margin:getComputedStyle(document.body).margin,padding:getComputedStyle(document.querySelector('#host-button')).padding,font:getComputedStyle(document.querySelector('#host-book')).fontSize,color:getComputedStyle(document.querySelector('#host-book')).color,theme:document.body.dataset.theme,rootFont:document.documentElement.style.getPropertyValue('--font-size')});
  const before=await page.evaluate(hostState);
  expect(before).toEqual({margin:'24px',padding:'3px 8px',font:'13px',color:'rgb(128, 0, 128)',theme:undefined,rootFont:''});
  const a=mount(page,'one'),b=mount(page,'two');
  await a.locator('#reading-settings summary').click();
  await a.locator('#font-size').fill('28');await a.locator('#font-size').dispatchEvent('input');await a.locator('#theme').selectOption('night');
  await expect(a.locator('article')).toHaveCSS('font-size','28px');await expect(b.locator('article')).toHaveCSS('font-size','20px');
  await expect(a.locator('#viewport')).toHaveCSS('color','rgb(255, 255, 255)');await expect(b.locator('#viewport')).toHaveCSS('color','rgb(0, 0, 0)');
  await a.locator('#reading-settings summary').click();
  expect(await page.evaluate(hostState)).toEqual(before);
  const sizes=await page.locator('.mount').evaluateAll(elements=>elements.map(el=>{const root=el.firstElementChild.shadowRoot;const frame=el.getBoundingClientRect(),view=root.querySelector('#viewport').getBoundingClientRect(),toc=root.querySelector('#toc').getBoundingClientRect();return {height:frame.height,viewHeight:view.height,inside:view.bottom<=frame.bottom+1&&view.right<=frame.right+1,stacked:toc.bottom<=view.top+1,width:frame.width};}));
  for(const size of sizes) {expect(size.height).toBe(620);expect(size.inside).toBe(true);expect(size.viewHeight).toBeGreaterThan(150);expect(size.stacked).toBe(size.width<540);}
  await a.evaluate(el=>el.style.height='450px');
  expect((await a.boundingBox()).height).toBe(450);expect((await b.boundingBox()).height).toBe(620);
  // Host CSS also must not restyle shadow-contained prose and controls.
  await page.addStyleTag({content:'article,ruby,a,button,.book { font-size:44px!important; color:red!important; writing-mode:horizontal-tb!important; }'});
  await expect(b.locator('article')).toHaveCSS('font-size','20px');await expect(b.locator('article')).toHaveCSS('writing-mode','vertical-rl');
  await page.locator('#host-button').click();await expect(page.locator('#host-count')).toHaveText('1');
  await page.screenshot({path:`evidence/embed-isolation-${info.project.name}.png`,fullPage:true});
});

test('same-book IDs, TOC, links and focus stay inside each instance',async({page})=>{
  await page.locator('[data-panel="two"] select').first().selectOption('horizontal');await page.locator('[data-panel="two"] [data-open]').click();
  await expect(mount(page,'two').locator('#status')).toContainText('The Small Harbour を開きました');
  await page.evaluate(()=>{const h=document.createElement('h2');h.id='h-3';h.textContent='Host h-3';document.body.prepend(h);});
  const a=mount(page,'one'),b=mount(page,'two');
  await a.locator('#toc a').last().click();await expect(a.locator('#h-3')).toBeFocused();
  expect(await b.locator('#viewport').evaluate(el=>el.scrollTop)).toBe(0);
  const firstScroll=await a.locator('#viewport').evaluate(el=>el.scrollTop);
  await b.locator('article a[href="#h-3"]').click();await expect(b.locator('#h-3')).toBeFocused();
  expect(await a.locator('#viewport').evaluate(el=>el.scrollTop)).toBe(firstScroll);
  const ids=await page.evaluate(async()=>{
    const {readers}=await import('./embed-demo.mjs');
    const reader=readers.get('one'),position=[scrollX,scrollY],snapshot=reader.getSnapshot();snapshot.book.toc[0].id='host-change';
    const navigated=reader.navigate('h-1'),pageMoved=scrollX!==position[0]||scrollY!==position[1];
    return {globalIds:[document.querySelectorAll('#h-1').length,document.querySelectorAll('#h-3').length],hash:location.hash,logical:reader.getSnapshot().book.toc.map(h=>h.id),unknown:reader.navigate('h-999'),host:document.getElementById('h-1').textContent,navigated,pageMoved};
  });
  expect(ids.globalIds).toEqual([1,1]);expect(ids.logical).toEqual(['h-1','h-2','h-3']);expect(ids.hash).toBe('');expect(ids.unknown).toBe(false);expect(ids.host).toContain('ホストの見出し');
  expect(ids.navigated).toBe(true);expect(ids.pageMoved).toBe(false);
});

test('three books retain ruby, RTL, images and bounded vertical navigation',async({page},info)=>{
  const v=mount(page,'two'),r=mount(page,'three');
  await expect(v.locator('ruby')).toHaveCount(7);await expect(v.locator('ruby rt').first()).toHaveText('みなと');
  await expect(v.locator('article')).toHaveCSS('writing-mode','vertical-rl');await expect(v.locator('article')).toHaveCSS('direction','ltr');
  await expect(v.locator('.cover img')).toHaveAttribute('alt','紺色の空に金色の月と白い港');
  await expect(r.locator('article')).toHaveCSS('direction','rtl');await expect(r.locator('bdi[lang="en"]').first()).toHaveCSS('unicode-bidi','isolate');
  await v.locator('#toc a').last().click();await expect(v.locator('#h-3')).toBeFocused();
  expect(await v.locator('#viewport').evaluate(el=>Math.abs(el.scrollLeft))).toBeGreaterThan(100);
  await v.locator('#toc a').first().click();
  const geometry=await v.locator('ruby').first().evaluate(el=>{const range=document.createRange();range.selectNodeContents(el.firstChild);return {base:range.getBoundingClientRect().x,rt:el.querySelector('rt').getBoundingClientRect().x};});
  expect(geometry.rt).toBeGreaterThan(geometry.base);
  for(const name of ['one','two','three']) expect(await mount(page,name).locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await v.screenshot({path:`evidence/embed-vertical-${info.project.name}.png`});
  await r.screenshot({path:`evidence/embed-rtl-${info.project.name}.png`});
});

test('destroy during host acquisition settles immediately and ignores a late result',async({page})=>{
  await page.evaluate(async header=>{
    const {readers}=await import('./embed-demo.mjs');const reader=readers.get('one');
    window.pending=reader.open(signal=>new Promise(resolve=>{window.abortSeen=false;signal.addEventListener('abort',()=>window.abortSeen=true);window.release=()=>resolve([{path:'book.md',file:new File([header+'late'],'book.md')}]);}));
    window.oldElement=reader.element;reader.destroy();window.outcome=await window.pending;window.release();
  },header);
  await expect(mount(page,'one').locator('[data-yompub-reader]')).toHaveCount(0);
  const state=await page.evaluate(()=>({outcome:window.outcome,abort:window.abortSeen,urls:window.resources.urls.size,workers:window.resources.workers.size,children:window.oldElement.shadowRoot.childElementCount}));
  expect(state).toEqual({outcome:{status:'destroyed'},abort:true,urls:3,workers:0,children:0});
  await expect(mount(page,'two').locator('#book-title')).toHaveText('月の港');
});

test('destroy during image decoding releases resources and cannot restore DOM',async({page})=>{
  await page.evaluate(async header=>{
    const {readers}=await import('./embed-demo.mjs');const reader=readers.get('one');
    const image=await (await fetch('./samples/vertical/assets/harbour.png')).blob();
    window.releaseDecode=null;const decode=HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode=function(){return new Promise(resolve=>{window.releaseDecode=()=>{HTMLImageElement.prototype.decode=decode;resolve();};});};
    window.pending=reader.open([{path:'book.md',file:new File([header+'![light](assets/light.png)'],'book.md')},{path:'assets/light.png',file:image}]);
  },header);
  await expect.poll(()=>page.evaluate(()=>typeof window.releaseDecode)).toBe('function');
  expect(await page.evaluate(()=>window.resources.urls.size)).toBe(5);
  const outcome=await page.evaluate(async()=>{const {readers}=await import('./embed-demo.mjs');readers.get('one').destroy();const result=await window.pending;window.releaseDecode();return result;});
  expect(outcome.status).toBe('destroyed');
  await expect.poll(()=>page.evaluate(()=>window.resources.urls.size)).toBe(3);
  expect(await page.evaluate(()=>window.resources.workers.size)).toBe(0);
  await expect(mount(page,'one').locator('article')).toHaveCount(0);
  expect(await page.evaluate(()=>window.resources.errors)).toEqual([]);
});

test('superseded loads, invalid input and repeated destroy/recreate preserve other readers',async({page})=>{
  const results=await page.evaluate(async header=>{
    const {readers}=await import('./embed-demo.mjs'),{createReader}=await import('./reader.mjs');
    let reader=readers.get('one');const files=text=>[{path:'book.md',file:new File([text],'book.md')}];
    let release;const old=reader.open(()=>new Promise(resolve=>{release=()=>resolve(files(header+'stale'));}));
    const fresh=await reader.open(files(header+'fresh'));const cancelled=await old;release();
    const failure=await reader.open(files(header+'<script>bad</script>'));
    const preserved=reader.getSnapshot().source;const detached=[];
    for(let i=0;i<3;i++) {
      const input=reader.element.shadowRoot.querySelector('#font-size'),view=reader.element.shadowRoot.querySelector('#viewport');
      reader.destroy();input.value='32';input.dispatchEvent(new Event('input',{bubbles:true}));detached.push(view.childElementCount);
      reader=createReader(document.getElementById('mount-one'));await reader.open(files(header+'recreated '+i));
    }
    reader.close();const empty=reader.getSnapshot();reader.destroy();reader.destroy();const after=await reader.open(files(header+'ignored'));
    readers.delete('one');return {fresh,cancelled,failure,preserved,detached,empty,after};
  },header);
  expect(results.fresh.status).toBe('opened');expect(results.cancelled.status).toBe('cancelled');expect(results.failure.code).toBe('HTML');
  expect(results.preserved).toContain('fresh');expect(results.detached).toEqual([0,0,0]);expect(results.empty).toBeNull();expect(results.after.status).toBe('destroyed');
  expect(await page.evaluate(()=>({urls:window.resources.urls.size,workers:window.resources.workers.size,errors:window.resources.errors}))).toEqual({urls:3,workers:0,errors:[]});
  await expect(mount(page,'two').locator('#book-title')).toHaveText('月の港');await expect(mount(page,'three').locator('#book-title')).toHaveText('ضوء الميناء');
});

test('destroy during Worker parse and recreate without a late update',async({page})=>{
  const result=await page.evaluate(async header=>{
    const {readers}=await import('./embed-demo.mjs'),{createReader}=await import('./reader.mjs');let reader=readers.get('one');
    let parsed=false;reader.element.addEventListener('yompub-state',event=>{if(event.detail.state==='parse'){parsed=true;reader.destroy();}});
    const outcome=await reader.open([{path:'book.md',file:new File([header+('A paragraph. *A light*.\n\n').repeat(40000)],'book.md')}]);
    reader=createReader(document.getElementById('mount-one'));const next=await reader.open([{path:'book.md',file:new File([header+'Recreated.'],'book.md')}]);readers.set('one',reader);
    return {parsed,outcome,next,source:reader.getSnapshot().source};
  },header);
  expect(result.parsed).toBe(true);expect(result.outcome.status).toBe('destroyed');expect(result.next.status).toBe('opened');expect(result.source).toContain('Recreated.');
  expect(await page.evaluate(()=>window.resources.workers.size)).toBe(0);expect(await page.evaluate(()=>window.resources.errors)).toEqual([]);
});

test('host abort handlers may destroy or start a newer load synchronously',async({page})=>{
  const results=await page.evaluate(async header=>{
    const {readers}=await import('./embed-demo.mjs'),{createReader}=await import('./reader.mjs');
    readers.get('one').destroy();readers.delete('one');const container=document.getElementById('mount-one');
    const files=text=>[{path:'book.md',file:new File([header+text],'book.md')}],destroyed=[];
    for(const action of ['open','cancel','close']) {
      const reader=createReader(container);
      const pending=reader.open(signal=>new Promise(()=>{signal.addEventListener('abort',()=>reader.destroy());}));
      const followup=action==='open'?await reader.open(files('replacement')):reader[action]();
      destroyed.push({pending:await pending,followup:followup??null,connected:reader.element.isConnected});
    }
    const reader=createReader(container);let latest;
    const pending=reader.open(signal=>new Promise(()=>{signal.addEventListener('abort',()=>{latest=reader.open(files('event wins'));});}));
    const superseded=await reader.open(files('superseded'));
    const result={destroyed,superseded,pending:await pending,latest:await latest,source:reader.getSnapshot().source};
    reader.destroy();return result;
  },header);
  for(const item of results.destroyed) {expect(item.pending.status).toBe('cancelled');expect(item.connected).toBe(false);}
  expect(results.destroyed[0].followup.status).toBe('destroyed');
  expect(results.superseded.status).toBe('cancelled');expect(results.pending.status).toBe('cancelled');expect(results.latest.status).toBe('opened');expect(results.source).toContain('event wins');
  expect(await page.evaluate(()=>({urls:window.resources.urls.size,workers:window.resources.workers.size,errors:window.resources.errors}))).toEqual({urls:3,workers:0,errors:[]});
});

test('position listeners may resize their host without a ResizeObserver delivery loop',async({page})=>{
  await page.evaluate(async()=>{
    const {readers}=await import('./embed-demo.mjs'),reader=readers.get('one'),mount=reader.element.parentElement;
    window.positionChanges=0;
    reader.element.addEventListener('yompub-position',()=>{if(++window.positionChanges===1)mount.style.height='500px';});
    mount.style.height='580px';
  });
  await expect.poll(()=>mount(page,'one').evaluate(el=>el.getBoundingClientRect().height)).toBe(500);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await page.evaluate(()=>window.resources.errors)).toEqual([]);
  const beforePanel=await page.evaluate(()=>({count:window.positionChanges,height:document.querySelector('#mount-one').firstElementChild.shadowRoot.querySelector('#viewport').clientHeight}));
  await mount(page,'one').locator('#source-panel').evaluate(el=>{el.open=true;});
  await expect.poll(()=>page.evaluate(()=>window.positionChanges)).toBeGreaterThan(beforePanel.count);
  expect(await mount(page,'one').locator('#viewport').evaluate(el=>el.clientHeight)).toBeLessThan(beforePanel.height);
  const result=await page.evaluate(async()=>{
    const {readers}=await import('./embed-demo.mjs'),reader=readers.get('one');
    reader.element.parentElement.style.height='480px';reader.destroy();
    const count=window.positionChanges;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {before:count,after:window.positionChanges,errors:window.resources.errors};
  });
  expect(result.after).toBe(result.before);expect(result.errors).toEqual([]);
});
