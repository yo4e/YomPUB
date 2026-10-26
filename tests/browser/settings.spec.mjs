import { test, expect } from '@playwright/test';

test('white reader exposes live typography controls, ruby and nonzero Japanese advances', async ({page}, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.locator('[data-sample="vertical"]').click();
  await expect(page.locator('#status')).toContainText('月の港 を開きました');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.reading-layout')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  for (const [family, size, line] of [['gothic',32,2.4], ['mincho',16,1.6], ['mincho',24,2]]) {
    await page.getByLabel('書体', {exact:true}).selectOption(family);
    await page.getByLabel('文字サイズ', {exact:true}).fill(String(size));
    await page.getByLabel('行間', {exact:true}).fill(String(line));
    await expect(page.locator('article')).toHaveCSS('font-size', `${size}px`);
    expect(await page.locator('article').evaluate(el => parseFloat(getComputedStyle(el).lineHeight))).toBeCloseTo(size * line, 3);
    await expect(page.locator('article')).toHaveCSS('font-family', new RegExp(family === 'gothic' ? 'Yu Gothic' : 'Yu Mincho'));
    await expect(page.locator('#font-value')).toHaveText(`${size}px`);
    await expect(page.locator('#line-value')).toHaveText(`${line}倍`);
    await page.locator('#toc a').first().click();
    const geometry = await page.locator('article p').first().evaluate(p => {
      const nodes = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), advances = [];
      while (nodes.nextNode()) {
        const node = nodes.currentNode;
        if (node.parentElement.closest('rt,rp')) continue;
        for (let i = 1; i < node.length; i++) {
          if (!/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2}$/u.test(node.data.slice(i-1,i+1))) continue;
          const range = document.createRange(); range.setStart(node,i-1); range.setEnd(node,i);
          const a = range.getBoundingClientRect(); range.setStart(node,i); range.setEnd(node,i+1);
          const b = range.getBoundingClientRect();
          if (Math.abs(a.x-b.x)<1) advances.push((b.y-a.y)/parseFloat(getComputedStyle(p).fontSize));
        }
      }
      const ruby = p.querySelector('ruby'), range = document.createRange(); range.selectNodeContents(ruby.firstChild);
      const base = range.getBoundingClientRect(), note = ruby.querySelector('rt').getBoundingClientRect();
      return {advances, rubyOnRight:note.x >= base.right-1, baseHeight:base.height, rubyHeight:note.height};
    });
    expect(geometry.advances.length).toBeGreaterThan(10);
    expect(geometry.advances.filter(value => value < .8)).toEqual([]);
    expect(geometry.rubyOnRight).toBe(true);
    expect(geometry.baseHeight).toBeGreaterThan(0); expect(geometry.rubyHeight).toBeGreaterThan(0);
    const layout = await page.locator('#reader-mount').evaluate(mount => {
      const root = mount.firstElementChild.shadowRoot, view = root.querySelector('#viewport').getBoundingClientRect();
      return {height:view.height, pageFits:document.documentElement.scrollWidth <= innerWidth+1,
        controlsFit:[...root.querySelectorAll('.controls input,.controls select,.controls button')].every(el => {const b=el.getBoundingClientRect();return b.width>0 && b.left>=0 && b.right<=innerWidth;})};
    });
    expect(layout.height).toBeGreaterThan(150); expect(layout.pageFits).toBe(true); expect(layout.controlsFit).toBe(true);
    if (size !== 16) await page.locator('#reader-mount').screenshot({path:`evidence/settings-2026-10-26/${family}-${info.project.name}.png`});
  }
  // Native keyboard interaction must continue to work without losing input focus.
  const slider = page.getByLabel('文字サイズ', {exact:true}); await slider.focus(); await slider.press('ArrowRight');
  await expect(slider).toBeFocused(); await expect(slider).toHaveValue('25');
  expect(errors).toEqual([]);
});

for (const mode of ['vertical-rl', 'vertical-lr', 'horizontal-tb']) {
  test(`settings keep the reading text, start/end and advance in ${mode}`, async ({page}) => {
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('./embed.html');
    const result = await page.evaluate(async mode => {
      const {readers} = await import('./embed-demo.mjs');
      const reader = readers.get('two');
      const text = '静かな港に朝の光が差しこむ。読みかけの文章をそのまま追い続ける。'.repeat(60);
      const source = `---\nyompub: 0.1-draft.1\ntitle: 表示設定の回帰確認\nlang: ja\nwriting-mode: ${mode}\n---\n# はじまり\n\n${Array.from({length:8},(_,i)=>`段落${i}。${text}｜港《みなと》の灯り。`).join('\n\n')}`;
      await reader.open([{path:'book.md', file:new Blob([source])}]);
      const root = reader.element.shadowRoot, view = root.getElementById('viewport'), article = root.querySelector('article');
      const vertical = mode !== 'horizontal-tb', reverse = mode === 'vertical-rl';
      const target = root.querySelectorAll('article p')[3].firstChild;
      const range = document.createRange(); range.setStart(target,600); range.setEnd(target,601);
      const css = getComputedStyle(view);
      const boundary = () => {const box=view.getBoundingClientRect();return vertical ? (reverse ? box.left+view.clientLeft+view.clientWidth-parseFloat(css.paddingRight) : box.left+view.clientLeft+parseFloat(css.paddingLeft)) : box.top+view.clientTop+parseFloat(css.paddingTop);};
      const coordinate = () => {const box=range.getBoundingClientRect();return vertical ? (reverse ? box.right : box.left) : box.top;};
      if (vertical) view.scrollLeft += coordinate()-boundary(); else view.scrollTop += coordinate()-boundary();
      let events = 0; reader.element.addEventListener('yompub-position',()=>events++);
      const before = reader.getPosition(), samples = [];
      for (const options of [{fontSize:32,lineHeight:2.4,fontFamily:'gothic'}, {fontSize:16,lineHeight:1.6,fontFamily:'mincho'}, {fontSize:24,lineHeight:2,fontFamily:'gothic'}, {chrome:'none',lineHeight:2.3}, {chrome:'full'}]) {
        reader.setOptions(options);
        samples.push({options,distance:Math.abs(coordinate()-boundary()), sameArticle:root.querySelector('article')===article, position:reader.getPosition(), lineHeight:getComputedStyle(article).lineHeight});
      }
      const beforeAdvance = reader.getPosition().progress;
      reader.advance(1); const afterAdvance = reader.getPosition().progress;
      reader.advance(-1); const afterBack = reader.getPosition().progress;
      view.scrollTo({left:0,top:0,behavior:'instant'}); const resetStart = reader.getPosition(); reader.setOptions({fontSize:32,lineHeight:2.4});
      const start = {...reader.getPosition(),left:view.scrollLeft,top:view.scrollTop,extent:view.scrollWidth-view.clientWidth};
      view.scrollTo(vertical ? {left:reverse?-view.scrollWidth:view.scrollWidth,behavior:'instant'} : {top:view.scrollHeight,behavior:'instant'});
      const resetEnd=reader.getPosition();reader.setOptions({fontSize:16,lineHeight:1.6,fontFamily:'mincho'});
      return {before,samples,beforeAdvance,afterAdvance,afterBack,resetStart,resetEnd,start,end:{...reader.getPosition(),left:view.scrollLeft,top:view.scrollTop,extent:view.scrollWidth-view.clientWidth},events,sourceUnchanged:reader.getSnapshot().source===source};
    }, mode);
    expect(result.before.progress).toBeGreaterThan(.1); expect(result.before.progress).toBeLessThan(.9);
    for (const sample of result.samples) {
      // The same character remains within two maximum-sized lines of the reading edge.
      expect(sample.distance,JSON.stringify(result.samples)).toBeLessThan(154); expect(sample.sameArticle).toBe(true);
      expect(sample.position.atStart).toBe(false); expect(sample.position.atEnd).toBe(false);
    }
    expect(parseFloat(result.samples[3].lineHeight)).toBeCloseTo(55.2,3);
    expect(result.afterAdvance).toBeGreaterThan(result.beforeAdvance); expect(result.afterBack).toBeCloseTo(result.beforeAdvance,2);
    expect(result.start.atStart,JSON.stringify({reset:result.resetStart,result:result.start})).toBe(true); expect(result.end.atEnd,JSON.stringify({reset:result.resetEnd,result:result.end})).toBe(true);
    expect(result.events).toBeGreaterThanOrEqual(7); expect(result.sourceUnchanged).toBe(true);
  });
}

test('options validate atomically and work in hidden chrome without leaking to another reader', async ({page}) => {
  await page.goto('./embed.html');
  await expect(page.locator('#mount-one #status')).toContainText('を開きました');
  await expect(page.locator('#mount-two #status')).toContainText('を開きました');
  const result = await page.evaluate(async () => {
    const {readers} = await import('./embed-demo.mjs'), {createReader} = await import('./reader.mjs');
    const a=readers.get('one'), b=readers.get('two'), source='---\nyompub: 0.1-draft.1\ntitle: Reopened\nlang: ja\n---\n# もう一度\n\n設定を保って開く。';
    const style = reader => {const root=reader.element.shadowRoot, article=root.querySelector('article');return {size:getComputedStyle(article).fontSize,line:getComputedStyle(article).lineHeight,font:getComputedStyle(article).fontFamily, theme:root.querySelector('.shell').dataset.theme};};
    const bBefore=style(b), original=a.element.shadowRoot.querySelector('article');
    a.setOptions({chrome:'none',fontSize:28,lineHeight:2.2,fontFamily:'gothic'});
    const valid=style(a), rejected=[];
    for (const options of [{lineHeight:1.5},{lineHeight:2.5},{lineHeight:NaN},{lineHeight:Infinity},{fontFamily:'serif'},{fontSize:20,lineHeight:0}]) {
      try {a.setOptions(options);rejected.push(false);} catch(error) {rejected.push(error instanceof RangeError);}
    }
    const unchanged=JSON.stringify(style(a))===JSON.stringify(valid), sameArticle=a.element.shadowRoot.querySelector('article')===original;
    a.close();await a.open([{path:'book.md',file:new Blob([source])}]);
    const reopened=style(a), sizeBefore=b.element.parentElement.children.length;
    let constructorRejected=false;
    try {createReader(b.element.parentElement,{fontFamily:'invalid'});} catch(error) {constructorRejected=error instanceof RangeError;}
    const noPartialElement=b.element.parentElement.children.length===sizeBefore;
    a.destroy();let destroyedRejected=false;try{a.setOptions({lineHeight:2});}catch{destroyedRejected=true;}
    return {valid,reopened,rejected,unchanged,sameArticle,bBefore,bAfter:style(b),constructorRejected,noPartialElement,destroyedRejected};
  });
  expect(result.valid.size).toBe('28px'); expect(parseFloat(result.valid.line)).toBeCloseTo(61.6,3); expect(result.valid.font).toContain('Yu Gothic');
  expect(result.rejected).toEqual([true,true,true,true,true,true]); expect(result.unchanged).toBe(true); expect(result.sameArticle).toBe(true);
  expect(result.reopened).toEqual(result.valid); expect(result.bAfter).toEqual(result.bBefore);
  expect(result.constructorRejected).toBe(true); expect(result.noPartialElement).toBe(true); expect(result.destroyedRejected).toBe(true);
});
