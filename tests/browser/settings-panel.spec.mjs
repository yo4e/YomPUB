import { test, expect } from '@playwright/test';

const geometry = view => view.evaluate(el=>({width:el.clientWidth,height:el.clientHeight,left:el.scrollLeft,top:el.scrollTop,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}));

test('settings panel opens over the book without moving reading position and returns keyboard focus',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await page.locator('[data-sample="vertical"]').click();
  await expect(page.locator('#status')).toContainText('月の港 を開きました');
  const summary=page.locator('#reading-settings summary'),panel=page.getByRole('group',{name:'読書の表示設定'}),view=page.locator('#viewport');
  await expect(panel).toBeHidden();
  await page.locator('#toc a').last().click();
  const before=await geometry(view);
  expect(Math.abs(before.left)).toBeGreaterThan(100);
  const article=await page.locator('article').elementHandle();
  await summary.focus();await summary.press('Enter');
  await expect(panel).toBeVisible();expect(await geometry(view)).toEqual(before);
  await page.getByLabel('文字サイズ',{exact:true}).fill('28');
  await page.getByLabel('行間',{exact:true}).fill('2.2');
  await page.getByLabel('書体',{exact:true}).selectOption('gothic');
  await page.getByLabel('配色',{exact:true}).selectOption('night');
  const changed=await geometry(view);
  await page.locator('#reader-mount').screenshot({path:`evidence/settings-panel/night-${info.project.name}.png`});
  const slider=page.getByLabel('文字サイズ',{exact:true});await slider.focus();await slider.press('Escape');
  await expect(panel).toBeHidden();await expect(summary).toBeFocused();expect(await geometry(view)).toEqual(changed);
  await summary.press('Space');await expect(panel).toBeVisible();
  await expect(slider).toHaveValue('28');
  await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveValue('29');await expect(slider).toBeFocused();
  expect(await article.evaluate(el=>el.isConnected)).toBe(true);
  await expect(page.locator('article')).toHaveCSS('writing-mode','vertical-rl');
  await expect(page.locator('ruby rt').first()).toHaveText('みなと');
  await page.getByLabel('配色',{exact:true}).selectOption('paper');
  await page.locator('#reader-mount').screenshot({path:`evidence/settings-panel/paper-${info.project.name}.png`});
  await page.locator('#close-book').click();await expect(page.locator('#reader')).toBeHidden();
  await page.locator('[data-sample="vertical"]').click();await expect(page.locator('#status')).toContainText('月の港 を開きました');
  await expect(panel).toBeHidden();await summary.click();await expect(slider).toHaveValue('29');
  expect(errors).toEqual([]);
});

test('settings panel fits a narrow embedded reader and stays local to its instance',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:320,height:780});
  await page.goto('./embed.html');
  const a=page.locator('#mount-one'),b=page.locator('#mount-two');
  for(const mount of [a,b])await expect(mount.locator('#status')).toContainText('を開きました');
  await a.locator('#reading-settings summary').click();
  await expect(b.locator('.controls')).toBeHidden();
  const boxes=await a.evaluate(mount=>{
    const root=mount.firstElementChild.shadowRoot,frame=mount.getBoundingClientRect(),panel=root.querySelector('.controls').getBoundingClientRect();
    return {inside:panel.left>=frame.left&&panel.right<=frame.right&&panel.bottom<=frame.bottom,controls:[...root.querySelectorAll('.controls input,.controls select')].every(el=>{const box=el.getBoundingClientRect();return box.width>0&&box.left>=panel.left&&box.right<=panel.right;}),pageFits:document.documentElement.scrollWidth<=innerWidth+1};
  });
  expect(boxes).toEqual({inside:true,controls:true,pageFits:true});
  await a.locator('#font-size').fill('30');await a.locator('#theme').selectOption('night');
  await expect(a.locator('article')).toHaveCSS('font-size','30px');await expect(b.locator('article')).toHaveCSS('font-size','20px');
  await a.screenshot({path:`evidence/settings-panel/embedded-narrow-${info.project.name}.png`});
  await page.evaluate(async()=>{const {readers}=await import('./embed-demo.mjs');readers.get('one').setOptions({chrome:'none',fontSize:24});});
  await expect(a.locator('#reading-settings')).not.toHaveAttribute('open');await expect(a.locator('.reader-top')).toBeHidden();
  await expect(a.locator('article')).toHaveCSS('font-size','24px');
  await page.evaluate(async()=>{const {readers}=await import('./embed-demo.mjs');readers.get('one').setOptions({chrome:'full'});});
  await expect(a.locator('#reading-settings summary')).toBeVisible();await expect(a.locator('.controls')).toBeHidden();
  await a.locator('#reading-settings summary').click();
  await page.getByLabel('Aの本',{exact:true}).selectOption('vertical');await page.locator('[data-panel="one"] [data-open]').click();
  await expect(a.locator('#status')).toContainText('月の港 を開きました');await expect(a.locator('.controls')).toBeHidden();
  expect(errors).toEqual([]);
});
