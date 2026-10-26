import { test, expect } from '@playwright/test';

function contrast(a,b) {
  const luminance = color => color.match(/\d+(?:\.\d+)?/g).slice(0,3).map(n=>{
    const value=Number(n)/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
  }).reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

test('plain day/night colors keep blue links readable and preserve reading layout',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await page.locator('[data-sample="vertical"]').click();
  await expect(page.locator('#status')).toContainText('月の港 を開きました');
  await page.locator('#reading-settings summary').click();
  await page.getByLabel('文字サイズ',{exact:true}).fill('28');
  await page.getByLabel('行間',{exact:true}).fill('2.2');
  await page.getByLabel('書体',{exact:true}).selectOption('gothic');
  await page.locator('#reading-settings summary').click();
  await page.locator('#toc a').first().click();
  await page.locator('#reading-settings summary').click();
  const article=await page.locator('article').elementHandle();
  const geometry=()=>page.locator('#viewport').evaluate(view=>({left:view.scrollLeft,top:view.scrollTop,width:view.clientWidth,height:view.clientHeight,scrollWidth:view.scrollWidth}));
  const before=await geometry();
  for(const [theme,paper,ink,blue] of [
    ['paper','rgb(255, 255, 255)','rgb(0, 0, 0)','rgb(0, 0, 238)'],
    ['night','rgb(0, 0, 0)','rgb(255, 255, 255)','rgb(102, 153, 255)'],
    ['paper','rgb(255, 255, 255)','rgb(0, 0, 0)','rgb(0, 0, 238)']
  ]) {
    await page.getByLabel('配色',{exact:true}).selectOption(theme);
    for(const target of ['html','.shell','.reading-layout','#theme','#close-book']) await expect(page.locator(target)).toHaveCSS('background-color',paper);
    for(const target of ['html','.shell','#viewport','#theme','#close-book','article blockquote']) await expect(page.locator(target)).toHaveCSS('color',ink);
    for(const target of ['#toc a','article a']) await expect(page.locator(target).first()).toHaveCSS('color',blue);
    await expect(page.locator('#font-size')).toHaveCSS('accent-color',blue);
    await expect(page.locator('.shell')).toHaveCSS('color-scheme',theme==='night'?'dark':'light');
    await page.locator('#font-size').focus();
    await page.locator('#font-size').press('ArrowRight');await page.locator('#font-size').press('ArrowLeft');
    await expect(page.locator('#font-size')).toBeFocused();
    await expect(page.locator('#font-size')).toHaveCSS('outline-color',blue);
    expect(contrast(blue,paper)).toBeGreaterThan(7);
    expect(contrast(ink,paper)).toBe(21);
    const muted=await page.locator('#book-author').evaluate(el=>getComputedStyle(el).color);
    expect(contrast(muted,paper)).toBeGreaterThan(4.5);
    expect(await geometry()).toEqual(before);
    expect(await article.evaluate(el=>el.isConnected)).toBe(true);
    await expect(page.locator('article')).toHaveCSS('font-size','28px');
    await expect(page.locator('article')).toHaveCSS('writing-mode','vertical-rl');
    await expect(page.locator('ruby rt').first()).toHaveText('みなと');
    await page.locator('#reader-mount').screenshot({path:`evidence/palette-2026-10-26/${theme}-${info.project.name}.png`});
  }
  await page.locator('#reading-settings summary').click();
  await page.locator('#toc a').last().click();
  await expect(page.locator('#h-3')).toBeFocused();
  expect(Math.abs((await geometry()).left)).toBeGreaterThan(Math.abs(before.left));
  expect(errors).toEqual([]);
});

test('embedding colors are opt-in per reader and theme changes do not leak to the host',async({page})=>{
  await page.goto('./embed.html');
  for(const name of ['one','two']) await expect(page.locator(`#mount-${name} #status`)).toContainText('を開きました');
  const result=await page.evaluate(async()=>{
    const {readers}=await import('./embed-demo.mjs'),a=readers.get('one'),b=readers.get('two');
    const colors=reader=>{
      const root=reader.element.shadowRoot;
      return {paper:getComputedStyle(root.querySelector('.reading-layout')).backgroundColor,ink:getComputedStyle(root.querySelector('#viewport')).color,link:getComputedStyle(root.querySelector('article a')).color};
    };
    const host=()=>({background:getComputedStyle(document.body).backgroundColor,color:getComputedStyle(document.getElementById('host-book')).color});
    const beforeHost=host(),beforeB=colors(b),mount=document.getElementById('mount-one');
    for(const [key,value] of Object.entries({'paper-background':'#fffbea','paper-foreground':'#222222','paper-accent':'#0050aa','night-background':'#101010','night-foreground':'#eeeeee','night-accent':'#88b4ff'})) mount.style.setProperty(`--yompub-${key}`,value);
    const day=colors(a);
    a.setOptions({theme:'night',chrome:'none'});
    const night=colors(a),afterHost=host(),afterB=colors(b),reflected=a.element.dataset.yompubTheme;
    for(const key of [...mount.style]) if(key.startsWith('--yompub-'))mount.style.removeProperty(key);
    const reset=colors(a);
    return {day,night,beforeHost,afterHost,beforeB,afterB,reflected,reset};
  });
  expect(result.day).toEqual({paper:'rgb(255, 251, 234)',ink:'rgb(34, 34, 34)',link:'rgb(0, 80, 170)'});
  expect(result.night).toEqual({paper:'rgb(16, 16, 16)',ink:'rgb(238, 238, 238)',link:'rgb(136, 180, 255)'});
  expect(result.beforeHost).toEqual(result.afterHost);expect(result.beforeB).toEqual(result.afterB);expect(result.reflected).toBe('night');
  expect(result.reset).toEqual({paper:'rgb(0, 0, 0)',ink:'rgb(255, 255, 255)',link:'rgb(102, 153, 255)'});
});
