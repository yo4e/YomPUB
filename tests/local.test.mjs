import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, cp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadLocalBook } from '../src/local.mjs';
import { imageType } from '../src/assets.mjs';
const header='---\nyompub: 0.1-draft.1\ntitle: Local\nlang: en\n---\n# Test\n\n';
test('publication validator checks real local assets and forbids escapes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'yompub-local-'));
  try {
    await mkdir(join(dir,'assets'));
    await writeFile(join(dir,'book.md'),header+'![map](assets/map.png)');
    await assert.rejects(loadLocalBook(join(dir,'book.md')),e=>e.code==='ENOENT');
    await writeFile(join(dir,'assets/map.png'),'<svg onload="alert(1)"/>');
    await assert.rejects(loadLocalBook(join(dir,'book.md')),e=>e.code==='ASSET_TYPE');
    await rm(join(dir,'assets/map.png'));
    await symlink(join(process.cwd(),'samples/horizontal/assets/harbour.png'),join(dir,'assets/map.png'));
    await assert.rejects(loadLocalBook(join(dir,'book.md')),e=>e.code==='ASSET_SYMLINK');
    await rm(join(dir,'assets/map.png'));
    await cp('samples/horizontal/assets/harbour.png',join(dir,'assets/map.png'));
    assert.equal((await loadLocalBook(join(dir,'book.md'))).book.assets[0],'assets/map.png');
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('image type checks match extension and signature',()=>{
  assert.throws(()=>imageType('a.png',new Uint8Array([255,216,255])),e=>e.code==='ASSET_TYPE');
  assert.equal(imageType('a.jpg',new Uint8Array([255,216,255])),'image/jpeg');
  assert.equal(imageType('a.webp',new TextEncoder().encode('RIFF0000WEBP')),'image/webp');
});
test('CLI supports JSON stdout and nonzero diagnostics',()=>{
  const result=spawnSync(process.execPath,['src/cli.mjs','ast','samples/vertical/book.md'],{encoding:'utf8'});
  assert.equal(result.status,0); assert.equal(JSON.parse(result.stdout).metadata.title,'月の港');
  const missing=spawnSync(process.execPath,['src/cli.mjs','validate','missing.md'],{encoding:'utf8'});
  assert.equal(missing.status,1); assert.match(missing.stderr,/ERROR.*IO/);
  assert.equal(spawnSync(process.execPath,['src/cli.mjs'],{encoding:'utf8'}).status,2);
});
