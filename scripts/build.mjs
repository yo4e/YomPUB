import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
// dist is disposable build output; source/samples never get modified here.
await rm('dist', { recursive:true, force:true });
await mkdir('dist', { recursive:true });
await build({ entryPoints:['web/app.mjs','web/parser-worker.mjs'], bundle:true, format:'esm', platform:'browser', target:['es2022'], outdir:'dist', outExtension:{ '.js':'.mjs' }, sourcemap:true });
for (const file of ['index.html','style.css']) await cp(`web/${file}`, `dist/${file}`);
await cp('samples','dist/samples',{ recursive:true });
for (const file of ['LICENSE','THIRD_PARTY_NOTICES.md']) await cp(file,`dist/${file}`);
const lock = JSON.parse(await readFile('package-lock.json','utf8'));
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.dev) continue;
  const name = path.replace(/^node_modules\//,'').replaceAll('/','-');
  const files = (await readdir(path)).filter(f=>/^licen[cs]e(?:\.|$)/i.test(f));
  await mkdir(`dist/licenses/${name}`,{recursive:true});
  for (const file of files) await cp(`${path}/${file}`,`dist/licenses/${name}/${file}`);
}
console.log('Built local viewer in dist/');
