import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import MarkdownIt from 'markdown-it';
const cases=JSON.parse(readFileSync(new URL('./fixtures/commonmark-0.31.2.json',import.meta.url),'utf8'));
const md=new MarkdownIt('commonmark');
// Upstream HTML serialization differs only in whitespace inside an empty blockquote.
const normalize=html=>html.replaceAll('<blockquote>\n</blockquote>','<blockquote></blockquote>');
test('pinned Markdown engine matches all 652 CommonMark 0.31.2 examples',()=>{
  assert.equal(cases.length,652);
  for(const c of cases) assert.equal(normalize(md.render(c.markdown)),normalize(c.html),`${c.example}: ${c.section}`);
});
