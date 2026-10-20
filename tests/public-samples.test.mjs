import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publicSampleFiles } from '../scripts/public-samples.mjs';

test('publishing includes only the three designated books and referenced images',async()=>{
  const root=await mkdtemp(join(tmpdir(),'yompub-publication-'));
  try {
    const source='---\nyompub: 0.1-draft.1\ntitle: Sample\nlang: en\n---\n# Chapter\n\n![map](assets/map.png)\n';
    for (const name of ['horizontal','vertical','rtl','private-draft']) {
      await mkdir(join(root,name,'assets'),{recursive:true});
      await writeFile(join(root,name,'book.md'),source);
      await writeFile(join(root,name,'assets/map.png'),Buffer.from([137,80,78,71,13,10,26,10]));
      await writeFile(join(root,name,'private-notes.md'),'Do not publish.');
      await writeFile(join(root,name,'assets/unreferenced.png'),'Do not publish.');
    }
    await writeFile(join(root,'private-manuscript.md'),'Do not publish.');
    assert.deepEqual(await publicSampleFiles(root),[
      'horizontal/book.md','horizontal/assets/map.png',
      'vertical/book.md','vertical/assets/map.png',
      'rtl/book.md','rtl/assets/map.png'
    ]);
  } finally { await rm(root,{recursive:true,force:true}); }
});
