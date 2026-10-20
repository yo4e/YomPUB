import { renderBook } from '../src/render.mjs';
/** @typedef {import('../src/model.js').Book} Book */
/** @typedef {{stage:'parse'|'assets'}|{ok:true,source:string,book:Book,warnings:import('../src/model.js').Diagnostic[],assets:{path:string,mime:string,bytes:ArrayBuffer}[]}|{ok:false,code:string,message:string,line?:number}} WorkerResult */
/** @template {HTMLElement} T @param {string} id @returns {T} */
function byId(id) { const node = document.getElementById(id); if (!node) throw new Error(id); return /** @type {T} */ (node); }
/** @type {Worker|null} */ let worker = null;
/** @type {{book:Book,source:string,urls:string[]}|null} */ let current = null;
let generation = 0;
/** @type {Map<number,string[]>} */ const pendingUrls = new Map();
const status = byId('status'), errorBox = byId('error'), reader = byId('reader'), viewport = byId('viewport');
/** @param {string[]} urls */
function revoke(urls) { for (const url of urls) URL.revokeObjectURL(url); }
function stop() {
  generation++;
  worker?.terminate(); worker = null;
  for (const urls of pendingUrls.values()) revoke(urls);
  pendingUrls.clear();
  byId('cancel').hidden = true;
  reader.removeAttribute('aria-busy');
}
/** @param {import('./parser-worker.mjs').LoadRequest} request */
function load(request) {
  stop(); const ticket = generation;
  errorBox.hidden = true; status.textContent = '本を読み込んでいます…';
  byId('cancel').hidden = false; reader.setAttribute('aria-busy', 'true');
  worker = new Worker(new URL('./parser-worker.mjs', import.meta.url), { type:'module' });
  /** @param {string} message */
  function failure(message) {
    if (ticket !== generation) return;
    stop(); errorBox.textContent = message; errorBox.hidden = false;
    status.textContent = current ? '読み込みに失敗しました。前の本を表示しています。' : '読み込めませんでした。原稿またはフォルダを確認してください。';
  }
  worker.onerror = event => failure(`WORKER: ${event.message || 'Reader worker could not start.'}`);
  worker.onmessage = async (/** @type {MessageEvent<WorkerResult>} */ event) => {
    if (ticket !== generation) return;
    const result = event.data;
    if ('stage' in result) { status.textContent = result.stage === 'parse' ? '原稿を解析しています…' : '画像を読み込んでいます…'; return; }
    if (!result.ok) { failure(`${result.code}${result.line ? ` · ${result.line}行目` : ''}: ${result.message}`); return; }
    const map = new Map(result.assets.map(a => [a.path, URL.createObjectURL(new Blob([a.bytes], { type:a.mime }))]));
    const urls = [...map.values()]; pendingUrls.set(ticket, urls);
    try {
      const article = renderBook(result.book, { document, resolveAsset: path => {
        const url = map.get(path); if (!url) throw new Error(`Missing asset ${path}`); return url;
      } });
      await Promise.all([...article.querySelectorAll('img')].map(img => img.decode()));
      if (ticket !== generation) return;
      if (current) revoke(current.urls);
      current = { book:result.book, source:result.source, urls };
      pendingUrls.delete(ticket);
      const { metadata } = result.book;
      const title = byId('book-title'); title.textContent = metadata.title; title.lang = metadata.lang; title.dir = metadata.direction;
      byId('book-author').textContent = metadata.author ?? '';
      byId('mode-label').textContent = `${metadata.lang} · ${metadata.direction} · ${metadata.writingMode}`;
      viewport.replaceChildren(article);
      const nav = byId('toc'); const list = document.createElement('ol');
      for (const entry of result.book.toc) {
        const li = document.createElement('li'), a = document.createElement('a');
        a.href = `#${entry.id}`; a.textContent = entry.label; a.lang = metadata.lang; a.dir = metadata.direction;
        a.style.paddingInlineStart = `${(entry.level-1)*.65}rem`; li.append(a); list.append(li);
      }
      nav.replaceChildren(list);
      byId('source').textContent = result.source;
      byId('warnings').textContent = result.warnings.map(w => `${w.code}: ${w.message}`).join('\n');
      reader.hidden = false;
      viewport.scrollTop = 0;
      // In an RTL scroll container zero is the right-hand origin.
      viewport.scrollLeft = 0;
      stop();
      status.textContent = `${metadata.title} を開きました。${result.book.toc.length}項目の目次。`;
    } catch (error) { failure(`IMAGE: ${error instanceof Error ? error.message : String(error)}`); }
  };
  worker.postMessage(request);
}
for (const button of document.querySelectorAll('button[data-sample]')) {
  button.addEventListener('click', () => load({ kind:'sample', sample: /** @type {HTMLElement} */ (button).dataset.sample ?? '' }));
}
for (const id of ['folder','manuscript']) {
  const input = /** @type {HTMLInputElement} */ (byId(id));
  input.addEventListener('change', () => {
    const files = [...(input.files ?? [])]; input.value = '';
    // webkitRelativePath is not preserved by File structured cloning in WebKit.
    if (files.length) load({ kind:'files', files:files.map(file => ({ file, path:file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name })) });
  });
  input.addEventListener('cancel', () => { status.textContent = 'ファイル選択を中断しました。'; });
}
byId('cancel').addEventListener('click', () => { stop(); status.textContent = '読み込みを中断しました。'; });
byId('close-book').addEventListener('click', () => {
  stop(); if (current) revoke(current.urls); current = null;
  viewport.replaceChildren(); byId('toc').replaceChildren(); byId('source').textContent = ''; byId('warnings').textContent = '';
  reader.hidden = true; errorBox.hidden = true; status.textContent = '本を閉じました。次の本を選んでください。';
  /** @type {HTMLButtonElement|null} */ (document.querySelector('[data-sample]'))?.focus();
});
const size = /** @type {HTMLInputElement} */ (byId('font-size'));
size.addEventListener('input', () => { document.documentElement.style.setProperty('--font-size', `${size.value}px`); byId('font-value').textContent = size.value; });
const theme = /** @type {HTMLSelectElement} */ (byId('theme'));
theme.addEventListener('change', () => { document.body.dataset.theme = theme.value; });
/** @param {string} text @param {string} filename @param {string} type */
function download(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
byId('download-source').addEventListener('click', () => { if (current) download(current.source, 'book.md', 'text/markdown;charset=utf-8'); });
byId('download-ast').addEventListener('click', () => { if (current) download(JSON.stringify(current.book,null,2), 'book.ast.json', 'application/json'); });
// Both body and TOC links navigate within the scrollable reading region.
reader.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('a') : null;
  const href = target?.getAttribute('href');
  if (!href || !/^#h-[1-9][0-9]*$/.test(href)) return;
  const heading = viewport.querySelector(href);
  if (heading instanceof HTMLElement) { event.preventDefault(); heading.scrollIntoView({ block:'start', inline:'start' }); heading.focus({ preventScroll:true }); }
});
window.addEventListener('pagehide', event => { stop(); if (!event.persisted && current) revoke(current.urls); });
