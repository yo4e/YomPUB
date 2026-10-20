import { test, expect } from '@playwright/test';

test('diagnose vertical character advances',async({page,browserName},info)=>{
  await page.goto('./');
  await page.locator('[data-sample="vertical"]').click();
  await expect(page.locator('#status')).toContainText('月の港 を開きました');
  await page.locator('#toc a').first().click();
  const reports=[];
  for(const family of [null,'IPAGothic','WenQuanYi Zen Hei','serif']) {
    if(family) await page.locator('article').evaluate((el,f)=>{el.style.fontFamily=f;},family);
    for(const phase of ['before','after']) {
      if(phase==='after') await page.screenshot({path:info.outputPath(`vertical-${family ?? 'original'}.png`),fullPage:true});
      const geometry=await page.locator('article p').first().evaluate(el=>{
        const nodes=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
        const pairs=[];
        while(nodes.nextNode()) {
          const node=nodes.currentNode;
          if(node.parentElement.closest('rt,rp')) continue;
          for(let i=1;i<node.length;i++) {
            if(!/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{2}$/u.test(node.data.slice(i-1,i+1))) continue;
            const a=document.createRange(),b=document.createRange();
            a.setStart(node,i-1);a.setEnd(node,i);b.setStart(node,i);b.setEnd(node,i+1);
            const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
            if(Math.abs(ar.x-br.x)<1) pairs.push({text:node.data.slice(i-1,i+1),dy:br.y-ar.y,h:ar.height});
          }
        }
        return {font:getComputedStyle(el).fontFamily,min:Math.min(...pairs.map(p=>p.dy)),pairs};
      });
      let fonts;
      if(browserName==='chromium') {
        const session=await page.context().newCDPSession(page);
        await session.send('DOM.enable');await session.send('CSS.enable');
        const {root}=await session.send('DOM.getDocument');
        const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector:'article p'});
        fonts=await session.send('CSS.getPlatformFontsForNode',{nodeId});
        await session.detach();
      }
      reports.push({family,phase,geometry,fonts});
    }
  }
  console.log(JSON.stringify({project:info.project.name,reports}));
  expect(reports[0].geometry.min).toBeGreaterThanOrEqual(15);
});
