import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBook, decodeSource, isLanguage, isAssetPath, MAX_SOURCE_BYTES } from '../src/core.mjs';
const header = '---\nyompub: 0.1-draft.1\ntitle: Test\nlang: en\n---\n';
const manuscript = body => `${header}\n# Chapter\n\n${body}\n`;
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/conformance.json',import.meta.url),'utf8'));
for (const c of fixtures) test(`conformance: ${c.name}`, () => {
  if (c.error) assert.throws(() => parseBook(manuscript(c.body)), e => e.code === c.error);
  else assert.deepEqual(parseBook(manuscript(c.body)).book.blocks[1].children,c.inline);
});

for (const sample of ['horizontal','vertical','rtl']) test(`whole-book golden semantics: ${sample}`, () => {
  const source = readFileSync(`samples/${sample}/book.md`,'utf8');
  const actual = parseBook(source).book;
  const expected = JSON.parse(readFileSync(`tests/fixtures/${sample}.ast.json`,'utf8'));
  assert.deepEqual(actual,expected);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),actual);
  assert.equal(actual.toc.length,3);
  assert.equal(actual.toc[2].id,'h-3');
  if (sample === 'vertical') { assert.equal(actual.metadata.writingMode,'vertical-rl'); assert.equal(actual.metadata.direction,'ltr'); assert.equal(actual.toc[0].label,'第一章　港の灯り'); }
  if (sample === 'horizontal') assert.equal(actual.metadata.cover,null);
  if (sample === 'rtl') assert.equal(actual.metadata.direction,'rtl');
});

test('BOM and all source line endings have identical meaning', () => {
  const source = manuscript('café か\u3099');
  for(const changed of ['\ufeff'+source, source.replaceAll('\n','\r\n'), source.replaceAll('\n','\r')]) assert.deepEqual(parseBook(changed),parseBook(source));
});
test('metadata literals, unknown warning and default semantics', () => {
  const result = parseBook('---\nyompub: 0.1-draft.1\ntitle: "a: #b &amp;"\nlang: en\nx-note: literal\n---\n# Start');
  assert.equal(result.book.metadata.title,'"a: #b &amp;"');
  assert.equal(result.book.metadata.direction,'ltr');
  assert.equal(result.book.metadata.writingMode,'horizontal-tb');
  assert.equal(result.book.metadata.author,null);
  assert.equal(result.warnings[0].code,'UNKNOWN_FIELD');
});
for (const [name, source, code] of [
  ['absent header','# Hi','HEADER'],
  ['unclosed header','---\ntitle: Test','HEADER'],
  ['blank metadata line',header.replace('lang: en','\nlang: en')+'# C','HEADER'],
  ['duplicate metadata',header.replace('lang: en','lang: en\nlang: ja')+'# C','HEADER_DUPLICATE'],
  ['duplicate unknown',header.replace('lang: en','lang: en\nx-a: 1\nx-a: 2')+'# C','HEADER_DUPLICATE'],
  ['missing title',header.replace('title: Test\n','')+'# C','HEADER_REQUIRED'],
  ['empty title',header.replace('title: Test','title:   ')+'# C','HEADER'],
  ['future version',header.replace('0.1-draft.1','0.1-draft.2')+'# C','VERSION'],
  ['old short version',header.replace('0.1-draft.1','0.1')+'# C','VERSION'],
  ['invalid direction',header.replace('lang: en','lang: en\ndirection: sideways')+'# C','DIRECTION'],
  ['invalid mode',header.replace('lang: en','lang: en\nwriting-mode: auto')+'# C','WRITING_MODE'],
  ['cover without alt',header.replace('lang: en','lang: en\ncover: a.png')+'# C','COVER'],
  ['alt without cover',header.replace('lang: en','lang: en\ncover-alt: a')+'# C','COVER'],
  ['missing h1',header+'plain prose','HEADING'],
  ['h2 first',header+'## Section','HEADING'],
  ['bad language',header.replace('lang: en','lang: en_US')+'# C','LANG'],
  ['unpaired surrogate',manuscript('\ud800'),'UNICODE'],
  ['literal NUL',manuscript('\0'),'UNICODE'],
  ['source limit',manuscript('a'.repeat(MAX_SOURCE_BYTES)),'LIMIT'],
  ['deep nesting',manuscript('> '.repeat(130)+'hello'),'LIMIT']
]) test(name, () => assert.throws(() => parseBook(source),e=>e.code===code));

test('UTF-8 decoding rejects corrupt bytes, supports supplementary scalars', () => {
  assert.throws(()=>decodeSource(new Uint8Array([0xc0,0xaf])),e=>e.code==='UTF8');
  assert.throws(()=>decodeSource(new Uint8Array([0xed,0xa0,0x80])),e=>e.code==='UTF8');
  assert.equal(decodeSource(new TextEncoder().encode('🌊か\u3099')),'🌊か\u3099');
});
test('language well-formedness without implicit case/direction conversion', () => {
  for(const lang of ['ja','ar','EN-latn-us','en-GB-oed','i-klingon','zh-min-nan','x-custom','de-CH-1901','en-u-ca-gregory','sl-rozaj-biske','zh-cmn-Hans-CN','und']) assert.equal(isLanguage(lang),true,lang);
  for(const lang of ['','a','en_US',' en','en-','x','en-u','en-u-ca-u-nu','sl-rozaj-rozaj','en-123456789']) assert.equal(isLanguage(lang),false,lang);
  assert.equal(parseBook(manuscript('مرحبا').replace('lang: en','lang: ar')).book.metadata.direction,'ltr');
});
test('asset paths are portable local strings, never a decoded URL', () => {
  for(const path of ['a.png','assets/港.png','assets/A.JPG']) assert.ok(isAssetPath(path),path);
  for(const path of ['../a.png','/a.png','a//b.png','a/./b.png','a/../b.png','file:a.png','a%20b.png','a b.png','a.png?x','a.png#x','a\\b.png','a.svg']) assert.ok(!isAssetPath(path),path);
});
test('nested CommonMark structure, ordered start and loose paragraphs survive', () => {
  const b=parseBook(manuscript('3. first\n\n4. second\n\n   > quote\n\n   - nested\n\n~~~js\n<em>literal</em>\n~~~')).book.blocks;
  assert.equal(b[1].type,'list'); assert.equal(b[1].start,3); assert.equal(b[1].tight,false);
  assert.equal(b[1].children[1].children[1].type,'blockquote');
  assert.equal(b[1].children[1].children[2].type,'list');
  assert.equal(b[2].type,'codeBlock'); assert.equal(b[2].info,'js'); assert.equal(b[2].value,'<em>literal</em>\n');
});
test('setext headings and reference links resolve without authored TOC', () => {
  const b=parseBook(header+'Start\n=====\n\n## Second\n\n[go][r]\n\n[r]: #h-1 "Back"').book;
  assert.deepEqual(b.toc.map(h=>h.id),['h-1','h-2']);
  assert.equal(b.blocks[2].children[0].href,'#h-1'); assert.equal(b.blocks[2].children[0].title,'Back');
});
test('two backslashes do not escape a following reserved marker',()=>{
  assert.throws(()=>parseBook(manuscript(String.raw`{{en|ltr|a\\|b}}`)),e=>e.code==='SPAN');
  assert.throws(()=>parseBook(manuscript(String.raw`｜a\\｜b《c》`)),e=>e.code==='RUBY');
});
test('parser is deterministic across valid-invalid-valid runs',()=>{
  const good = manuscript('｜海《うみ》 {{ar|rtl|مرحبا}}'); const before=parseBook(good);
  for(let i=0;i<30;i++) { assert.throws(()=>parseBook(manuscript('｜broken'))); assert.deepEqual(parseBook(good),before); }
});

test('mailto restrictions and destination preservation',()=>{
  const href='HTTPS://example.org/港?q=1&b=2';
  assert.equal(parseBook(manuscript(`[x](${href})`)).book.blocks[1].children[0].href,href);
  assert.equal(parseBook(manuscript('[mail](mailto:reader@example.org)')).book.blocks[1].children[0].href,'mailto:reader@example.org');
  for(const href of ['mailto:a@b#fragment','mailto:a@b?subject=x','//example.org','https://user:pass@example.org','file:/tmp/a']) assert.throws(()=>parseBook(manuscript(`[x](${href})`)),e=>e.code==='LINK');
});
