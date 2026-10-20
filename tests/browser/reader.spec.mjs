import { test, expect } from '@playwright/test';
import { readFile, mkdtemp, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const header='---\nyompub: 0.1-draft.1\ntitle: Local test\nlang: en\n---\n# Start\n\n';
async function openSample(page,name,title) {
  await page.locator(`[data-sample="${name}"]`).click();
  await expect(page.locator('#status')).toContainText(`${title} を開きました`);
  await expect(page.locator('#error')).toBeHidden();
}
async function expectVerticalCharacterSpacing(page) {
  // A visible ruby rectangle alone does not catch zero-advance CJK glyphs.
  const pairs=await page.locator('article p').first().evaluate(el=>{
    const nodes=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),result=[];
    while(nodes.nextNode()) {
      const node=nodes.currentNode;
      if(node.parentElement.closest('rt,rp')) continue;
      const fontSize=parseFloat(getComputedStyle(node.parentElement).fontSize);
      for(let i=1;i<node.length;i++) {
        const text=node.data.slice(i-1,i+1);
        if(!/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2}$/u.test(text)) continue;
        const first=document.createRange(),next=document.createRange();
        first.setStart(node,i-1); first.setEnd(node,i);
        next.setStart(node,i); next.setEnd(node,i+1);
        const a=first.getBoundingClientRect(),b=next.getBoundingClientRect();
        if(Math.abs(a.x-b.x)<1) result.push({text,advance:(b.y-a.y)/fontSize});
      }
    }
    return result;
  });
  expect(pairs.length).toBeGreaterThan(10);
  expect(pairs.filter(pair=>pair.advance<.8)).toEqual([]);
}
test.beforeAll(async({request,baseURL})=>{
  if (process.env.YOMPUB_EXPECT_COMMIT) {
    // Pages deployment completion and CDN availability can be a few seconds apart.
    test.setTimeout(90000);
    await expect.poll(async()=>{
      const response=await request.get(new URL(`build-info.json?commit=${process.env.YOMPUB_EXPECT_COMMIT}`,baseURL).href);
      return response.ok() ? response.json() : {status:response.status()};
    },{timeout:60000,intervals:[1000,2000,5000]}).toEqual({format:'0.1-draft.1',commit:process.env.YOMPUB_EXPECT_COMMIT});
  }
});
test.beforeEach(async({page})=>{ const response=await page.goto('./'); expect(response.ok()).toBe(true); });

test('three books preserve semantics and real layout, navigation and typography',async({page},info)=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await openSample(page,'horizontal','The Small Harbour');
  await expect(page.locator('article')).toHaveAttribute('lang','en');
  await expect(page.locator('.cover')).toHaveCount(0);
  await expect(page.locator('#toc a')).toHaveCount(3);
  await expect(page.locator('article img')).toHaveAttribute('alt','A gold lamp beside three blue waves');
  await expect(page.locator('article h1')).toHaveCount(2);
  await expect(page.locator('article blockquote')).toHaveCount(1);
  await page.locator('#toc a').last().click();
  await expect(page.locator('#h-3')).toBeFocused();
  await expect.poll(()=>page.locator('#viewport').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await page.locator('#font-size').fill('28'); await page.locator('#font-size').dispatchEvent('input');
  await expect(page.locator('article')).toHaveCSS('font-size','28px');
  await page.locator('#theme').selectOption('night');
  await expect(page.locator('#viewport')).toHaveCSS('color','rgb(232, 231, 219)');
  await page.locator('#theme').selectOption('paper');
  await page.locator('#font-size').fill('20'); await page.locator('#font-size').dispatchEvent('input');
  await page.locator('#reader').scrollIntoViewIfNeeded();
  await page.screenshot({path:`evidence/horizontal-${info.project.name}.png`,fullPage:true});

  await openSample(page,'vertical','月の港');
  await expect(page.locator('article')).toHaveCSS('writing-mode','vertical-rl');
  await expect(page.locator('article')).toHaveCSS('direction','ltr');
  await expect(page.locator('.cover img')).toHaveAttribute('alt','紺色の空に金色の月と白い港');
  await expect(page.locator('ruby').first()).toContainText('港');
  await expect(page.locator('ruby rt').first()).toHaveText('みなと');
  await expect(page.locator('#toc a').first()).toHaveText('第一章　港の灯り');
  const geometry=await page.locator('article ruby').first().evaluate(r=>{
    const range=document.createRange(); range.selectNodeContents(r.firstChild);
    const base=range.getBoundingClientRect(), note=r.querySelector('rt').getBoundingClientRect();
    return {base:{x:base.x,y:base.y,w:base.width,h:base.height},note:{x:note.x,y:note.y,w:note.width,h:note.height}};
  });
  expect(geometry.base.h).toBeGreaterThan(0); expect(geometry.note.h).toBeGreaterThan(0);
  expect(geometry.note.x).toBeGreaterThan(geometry.base.x);
  await expectVerticalCharacterSpacing(page);
  await expect.poll(()=>page.locator('#viewport').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeGreaterThan(100);
  await page.locator('#toc a').last().click(); await expect(page.locator('#h-3')).toBeFocused();
  await expect.poll(()=>page.locator('#viewport').evaluate(e=>Math.abs(e.scrollLeft))).toBeGreaterThan(100);
  await page.locator('#toc a').first().click();
  await page.locator('#reader').scrollIntoViewIfNeeded();
  await page.screenshot({path:`evidence/vertical-${info.project.name}.png`,fullPage:true});
  await expectVerticalCharacterSpacing(page);

  await openSample(page,'rtl','ضوء الميناء');
  await expect(page.locator('article')).toHaveCSS('direction','rtl');
  await expect(page.locator('article')).toHaveCSS('writing-mode','horizontal-tb');
  const run=page.locator('article bdi').first();
  await expect(run).toHaveAttribute('lang','en'); await expect(run).toHaveCSS('direction','ltr');
  await expect(run).toHaveCSS('unicode-bidi','isolate'); await expect(run).toHaveText('The Small Harbour (2026)');
  const rects=await run.evaluate(el=>{
    const text=el.firstChild;
    const a=document.createRange(),z=document.createRange();
    a.setStart(text,0); a.setEnd(text,1); z.setStart(text,text.length-1); z.setEnd(text,text.length);
    return {first:a.getBoundingClientRect().x,last:z.getBoundingClientRect().x};
  });
  expect(rects.first).toBeLessThan(rects.last);
  await expect(page.locator('bdi[lang="he"]')).toHaveText('שלום');
  await page.locator('#reader').scrollIntoViewIfNeeded();
  await page.screenshot({path:`evidence/rtl-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});

test('local folder load, same-file reload, source and AST downloads',async({page})=>{
  const dir=await mkdtemp(join(tmpdir(),'yompub-reload-'));
  try {
    await cp(resolve('samples/vertical'),dir,{recursive:true});
    const original=await readFile(join(dir,'book.md'),'utf8');
    let source=original;
    for(let revision=0;revision<3;revision++) {
      const title=`月の港 ${revision}`;
      source=original.replace('title: 月の港',`title: ${title}`);
      await writeFile(join(dir,'book.md'),source);
      const chooser=page.waitForEvent('filechooser');
      await page.getByText('本のフォルダを開く',{exact:true}).click();
      await (await chooser).setFiles(dir);
      // A distinct title prevents the previous load's status from satisfying this wait.
      await expect(page.locator('#status')).toContainText(`${title} を開きました`);
      await expect(page.locator('#book-title')).toHaveText(title);
      await expect(page.locator('#source')).toHaveText(source);
      await expect(page.locator('article img')).toHaveCount(2);
      await expect(page.locator('#error')).toBeHidden();
    }
    // Also reopen an unchanged path: the newly rendered article must replace
    // the previous node even though the title and source are identical.
    const previousArticle=await page.locator('article').elementHandle();
    const chooser=page.waitForEvent('filechooser');
    await page.getByText('本のフォルダを開く',{exact:true}).click();
    await (await chooser).setFiles(dir);
    await expect.poll(()=>previousArticle.evaluate(node=>node.isConnected)).toBe(false);
    await expect(page.locator('#status')).toContainText('月の港 2 を開きました');
    await previousArticle.dispose();
    await page.locator('#source-panel summary').click();
    const sourceDownload=page.waitForEvent('download'); await page.locator('#download-source').click();
    const sourcePath=await (await sourceDownload).path();
    expect(await readFile(sourcePath,'utf8')).toBe(source);
    const astDownload=page.waitForEvent('download'); await page.locator('#download-ast').click();
    const ast=JSON.parse(await readFile(await (await astDownload).path(),'utf8'));
    expect(ast.metadata.title).toBe('月の港 2');
    expect(ast.metadata.writingMode).toBe('vertical-rl'); expect(ast.toc[0].label).toBe('第一章　港の灯り');
    await page.locator('#close-book').click(); await expect(page.locator('#reader')).toBeHidden();
    await expect(page.locator('#source')).toHaveText('');
    await openSample(page,'rtl','ضوء الميناء');
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('invalid files preserve prior book and can recover',async({page})=>{
  await openSample(page,'horizontal','The Small Harbour');
  for(const [body,code] of [['<script>window.bad=1</script>','HTML'],['｜broken','RUBY'],['![map](assets/missing.png)','MISSING_FILE'],['[x](javascript:alert(1))','LINK']]) {
    await page.locator('#manuscript').setInputFiles({name:'book.md',mimeType:'text/markdown',buffer:Buffer.from(header+body)});
    await expect(page.locator('#error')).toContainText(code);
    await expect(page.locator('#book-title')).toHaveText('The Small Harbour');
    expect(await page.evaluate(()=>window.bad)).toBeUndefined();
  }
  await page.locator('#manuscript').setInputFiles({name:'book.md',mimeType:'text/markdown',buffer:Buffer.from([0xc0,0xaf])});
  await expect(page.locator('#error')).toContainText('UTF8');
  await openSample(page,'vertical','月の港');
});

test('rapid switches, cancellation, and resource cleanup over repeated sessions',async({page})=>{
  await page.addInitScript(()=>{
    window.liveYompubUrls=new Set();
    const create=URL.createObjectURL.bind(URL), revoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=b=>{const u=create(b);window.liveYompubUrls.add(u);return u;};
    URL.revokeObjectURL=u=>{window.liveYompubUrls.delete(u);revoke(u);};
  });
  await page.reload();
  for(let i=0;i<4;i++) {
    await openSample(page,'horizontal','The Small Harbour');
    expect(await page.evaluate(()=>window.liveYompubUrls.size)).toBe(1);
    await openSample(page,'vertical','月の港');
    expect(await page.evaluate(()=>window.liveYompubUrls.size)).toBe(2);
    // Same JS task: cancel before a worker can commit a book.
    await page.evaluate(()=>{document.querySelector('[data-sample="rtl"]').click();document.querySelector('#cancel').click();});
    await expect(page.locator('#status')).toHaveText('読み込みを中断しました。');
    await expect(page.locator('#book-title')).toHaveText('月の港');
    await page.evaluate(()=>{document.querySelector('[data-sample="horizontal"]').click();document.querySelector('[data-sample="rtl"]').click();});
    await expect(page.locator('#status')).toContainText('ضوء الميناء を開きました');
    expect(await page.evaluate(()=>window.liveYompubUrls.size)).toBe(1);
    await page.locator('#close-book').click();
    expect(await page.evaluate(()=>window.liveYompubUrls.size)).toBe(0);
  }
  await page.locator('#manuscript').dispatchEvent('cancel');
  await expect(page.locator('#status')).toHaveText('ファイル選択を中断しました。');
});

test('a signature-valid but undecodable image fails transactionally',async({page})=>{
  const dir=await mkdtemp(join(tmpdir(),'yompub-browser-'));
  try {
    await mkdir(join(dir,'assets'));
    await writeFile(join(dir,'book.md'),header+'![bad](assets/bad.png)');
    await writeFile(join(dir,'assets/bad.png'),Buffer.from([137,80,78,71,13,10,26,10]));
    await openSample(page,'rtl','ضوء الميناء');
    await page.locator('#folder').setInputFiles(dir);
    await expect(page.locator('#error')).toContainText('IMAGE');
    await expect(page.locator('#book-title')).toHaveText('ضوء الميناء');
    await openSample(page,'horizontal','The Small Harbour');
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('local files load with external network blocked and no uploads',async({page,baseURL})=>{
  const allowed=new URL(baseURL), blobPrefix=`blob:${allowed.origin}/`;
  const isLocal=url=>url.startsWith(allowed.href)||url.startsWith(blobPrefix);
  const requests=[]; page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
  await page.context().route('**/*',route=>{
    const url=route.request().url();
    return isLocal(url) ? route.continue() : route.abort();
  });
  await page.locator('#folder').setInputFiles(resolve('samples/rtl'));
  await expect(page.locator('#status')).toContainText('ضوء الميناء を開きました');
  expect(requests.filter(r=>r.method!=='GET'||!isLocal(r.url))).toEqual([]);
});

test('cancel a running worker during a long manuscript parse, then reopen',async({page})=>{
  await openSample(page,'horizontal','The Small Harbour');
  await page.evaluate(()=>{
    const status=document.querySelector('#status');
    window.cancelledDuringParse=false;
    const observer=new MutationObserver(()=>{
      if(status.textContent==='原稿を解析しています…') {
        window.cancelledDuringParse=true;
        document.querySelector('#cancel').click();
        observer.disconnect();
      }
    });
    observer.observe(status,{childList:true});
  });
  const body=('A harbour and a light. *A promise* [a path](#h-1).\n\n').repeat(30000);
  await page.locator('#manuscript').setInputFiles({name:'book.md',mimeType:'text/markdown',buffer:Buffer.from(header+body)});
  await expect.poll(()=>page.evaluate(()=>window.cancelledDuringParse)).toBe(true);
  await expect(page.locator('#status')).toHaveText('読み込みを中断しました。');
  await expect(page.locator('#book-title')).toHaveText('The Small Harbour');
  await openSample(page,'vertical','月の港');
});

test('vertical-lr, auto direction and a plain manuscript remain renderable',async({page})=>{
  const source=header.replace('lang: en','lang: ja\ndirection: auto\nwriting-mode: vertical-lr')+'｜空《そら》と｜海《うみ》。';
  await page.locator('#manuscript').setInputFiles({name:'book.md',mimeType:'text/markdown',buffer:Buffer.from(source)});
  await expect(page.locator('#status')).toContainText('Local test を開きました');
  await expect(page.locator('article')).toHaveCSS('writing-mode','vertical-lr');
  await expect(page.locator('article')).toHaveAttribute('dir','auto');
  await expect(page.locator('article ruby')).toHaveCount(2);
});
