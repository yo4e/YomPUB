import { renderBook } from './render.mjs';
import styles from './reader.css';
import { markup } from './reader-ui.mjs';
import { captureReadingAnchor } from './reader-position.mjs';
/** @typedef {import('./reader-types.js').Publication} Publication */
/** @typedef {import('./reader-types.js').ReaderOptions} ReaderOptions */
/** @typedef {import('./reader-types.js').OpenResult} OpenResult */
/** @typedef {import('./reader-types.js').Job} Job */
/** @typedef {import('./reader-types.js').Snapshot} Snapshot */

/** Create one owned shadow root in a host-sized container. No document/global settings.
 * @param {HTMLElement} container @param {ReaderOptions} [options]
 */
export function createReader(container, options = {}) {
  const doc = container.ownerDocument;
  if (!doc.defaultView) throw new Error('Reader requires a browser document.');
  const win = doc.defaultView;
  /** @param {ReaderOptions} value */
  function validateOptions(value) {
    if (value.fontSize !== undefined && (!Number.isFinite(value.fontSize) || value.fontSize < 16 || value.fontSize > 32)) throw new RangeError('fontSize must be between 16 and 32.');
    if (value.lineHeight !== undefined && (!Number.isFinite(value.lineHeight) || value.lineHeight < 1.6 || value.lineHeight > 2.4)) throw new RangeError('lineHeight must be between 1.6 and 2.4.');
    if (value.fontFamily !== undefined && !['mincho','gothic'].includes(value.fontFamily)) throw new RangeError('fontFamily must be mincho or gothic.');
    if (value.theme !== undefined && !['paper','night'].includes(value.theme)) throw new RangeError('theme must be paper or night.');
    if (value.chrome !== undefined && !['full','none'].includes(value.chrome)) throw new RangeError('chrome must be full or none.');
  }
  validateOptions(options);
  const element = doc.createElement('div'); element.dataset.yompubReader = ''; element.tabIndex = -1;
  const root = element.attachShadow({ mode:'open' });
  const style = doc.createElement('style'); style.textContent = styles;
  const template = doc.createElement('template'); template.innerHTML = markup;
  root.append(style, template.content.cloneNode(true)); container.append(element);
  /** @param {string} id @returns {HTMLElement} */
  const get = id => { const node = root.getElementById(id); if (!node) throw new Error(id); return node; };
  const shell = /** @type {HTMLElement} */ (root.querySelector('.shell'));
  const reader = get('reader'), viewport = get('viewport'), status = get('status'), errorBox = get('error');
  const font = /** @type {HTMLInputElement} */ (get('font-size'));
  const lineHeight = /** @type {HTMLInputElement} */ (get('line-height'));
  const fontFamily = /** @type {HTMLSelectElement} */ (get('font-family'));
  const theme = /** @type {HTMLSelectElement} */ (get('theme'));
  const events = new AbortController();
  /** @type {Job|null} */ let active = null;
  /** @type {(Snapshot & {urls:string[]})|null} */ let current = null;
  /** @type {{book:Snapshot, left:number, top:number, width:number, height:number, restore:(() => void)|null}|null} */ let readingAnchor = null;
  let destroyed = false;
  let operation = 0; // Host AbortSignal handlers may synchronously call this API.
  const downloads = new Map();
  /** @param {string[]} urls */
  function revoke(urls) { for (const url of urls) win.URL.revokeObjectURL(url); }
  function clearDownloads() { for (const [timer,url] of downloads) { win.clearTimeout(timer); win.URL.revokeObjectURL(url); } downloads.clear(); }
  /** @param {string} state */
  function notify(state) {
    element.dispatchEvent(new win.CustomEvent('yompub-state', { bubbles:true, detail:{ state, hasBook:current !== null, title:current?.book.metadata.title ?? null } }));
  }
  /** @param {boolean} busy */
  function setBusy(busy) { get('cancel').hidden = !busy; if (busy) reader.setAttribute('aria-busy','true'); else reader.removeAttribute('aria-busy'); }
  /** @param {'cancelled'|'destroyed'} reason */
  function stop(reason) {
    if (!active) return;
    const job = active; active = null;
    job.worker?.terminate(); job.worker = null;
    revoke(job.urls); job.urls = []; job.resolve({ status:reason });
    job.controller.abort();
  }
  /** @param {Job} job */
  const isActive = job => !destroyed && active === job;
  /** @param {Job} job @param {string} code @param {string} message */
  function fail(job, code, message) {
    if (!isActive(job)) return;
    const revision = operation;
    active = null; job.worker?.terminate(); job.worker = null;
    revoke(job.urls); job.urls = []; job.resolve({ status:'error', code, message }); job.controller.abort();
    if (destroyed || revision !== operation) return;
    setBusy(false);
    errorBox.textContent = `${code}: ${message}`; errorBox.hidden = false;
    status.textContent = current ? '読み込みに失敗しました。前の本を表示しています。' : '読み込めませんでした。原稿またはフォルダを確認してください。';
    notify('error');
  }
  /** @param {ReaderOptions} value */
  function setOptions(value) {
    if (destroyed) throw new Error('Reader is destroyed.');
    validateOptions(value);
    const reflows = value.fontSize !== undefined || value.lineHeight !== undefined || value.fontFamily !== undefined || value.chrome !== undefined;
    // Reuse the same character while a slider is dragged. Recapturing a newly
    // wrapped line at every input would gradually drift to earlier/later text.
    if (current && reflows && (!readingAnchor || readingAnchor.book !== current || readingAnchor.left !== viewport.scrollLeft || readingAnchor.top !== viewport.scrollTop || readingAnchor.width !== viewport.clientWidth || readingAnchor.height !== viewport.clientHeight)) {
      readingAnchor = {book:current, left:viewport.scrollLeft, top:viewport.scrollTop, width:viewport.clientWidth, height:viewport.clientHeight, restore:captureReadingAnchor(viewport, current.book.metadata.writingMode)};
    }
    if (value.fontSize !== undefined) { shell.style.setProperty('--font-size',`${value.fontSize}px`); font.value = String(value.fontSize); get('font-value').textContent = `${value.fontSize}px`; font.setAttribute('aria-valuetext',`${value.fontSize}ピクセル`); }
    if (value.lineHeight !== undefined) { shell.style.setProperty('--line-height',String(value.lineHeight)); lineHeight.value = String(value.lineHeight); get('line-value').textContent = `${value.lineHeight}倍`; lineHeight.setAttribute('aria-valuetext',`${value.lineHeight}倍`); }
    if (value.fontFamily !== undefined) { shell.dataset.fontFamily = value.fontFamily; fontFamily.value = value.fontFamily; }
    if (value.theme !== undefined) { shell.dataset.theme = value.theme; element.dataset.yompubTheme = value.theme; theme.value = value.theme; }
    if (value.chrome !== undefined) shell.dataset.chrome = value.chrome;
    if (current && reflows && readingAnchor) {
      readingAnchor.restore?.();
      Object.assign(readingAnchor, {left:viewport.scrollLeft, top:viewport.scrollTop, width:viewport.clientWidth, height:viewport.clientHeight});
    }
    if (current) notifyPosition();
  }
  setOptions({ fontSize:20, lineHeight:options.chrome === 'none' ? 2 : 1.9, fontFamily:'mincho', theme:'paper', chrome:'full', ...options });
  function getPosition() {
    if (destroyed || !current) return null;
    const vertical = current.book.metadata.writingMode !== 'horizontal-tb';
    const extent = Math.max(0,vertical ? viewport.scrollWidth-viewport.clientWidth : viewport.scrollHeight-viewport.clientHeight);
    const offset = vertical ? Math.abs(viewport.scrollLeft) : viewport.scrollTop;
    return { progress:extent ? Math.min(1,Math.max(0,offset/extent)) : 1, atStart:offset<=1, atEnd:offset>=extent-1 };
  }
  function notifyPosition() { if (!destroyed) element.dispatchEvent(new win.CustomEvent('yompub-position',{bubbles:true,detail:getPosition()})); }
  /** Scroll one overlapping viewport in reading order, without changing page focus.
   * @param {-1|1} direction
   */
  function advance(direction) {
    if (direction !== -1 && direction !== 1) throw new RangeError('direction must be -1 or 1.');
    if (destroyed || !current) return false;
    const mode = current.book.metadata.writingMode;
    const behavior = win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (mode === 'horizontal-tb') viewport.scrollBy({top:direction*viewport.clientHeight*.85,behavior});
    else viewport.scrollBy({left:direction*viewport.clientWidth*.85*(mode==='vertical-rl'?-1:1),behavior});
    return true;
  }
  viewport.addEventListener('scroll',notifyPosition,{signal:events.signal});
  const resize = new win.ResizeObserver(notifyPosition); resize.observe(viewport);
  /** Resolve a logical heading within this book and scroll only its viewport.
   * @param {string} id
   */
  function navigate(id) {
    if (destroyed || !/^h-[1-9][0-9]*$/.test(id)) return false;
    const heading = root.getElementById(id);
    if (!heading || !viewport.contains(heading)) return false;
    const a = heading.getBoundingClientRect(), b = viewport.getBoundingClientRect();
    const css = win.getComputedStyle(viewport), mode = current?.book.metadata.writingMode;
    if (mode === 'vertical-rl') viewport.scrollLeft += a.right - b.right + parseFloat(css.paddingRight);
    else if (mode === 'vertical-lr') viewport.scrollLeft += a.left - b.left - parseFloat(css.paddingLeft);
    else viewport.scrollTop += a.top - b.top - parseFloat(css.paddingTop);
    heading.focus({ preventScroll:true }); return true;
  }
  /** @param {Job} job @param {Publication} publication */
  async function begin(job, publication) {
    try {
      if (!isActive(job)) return;
      const files = typeof publication === 'function' ? await publication(job.controller.signal) : publication;
      if (!isActive(job)) return;
      const worker = new win.Worker(new URL('./parser-worker.mjs', import.meta.url), { type:'module' }); job.worker = worker;
      worker.onerror = event => fail(job,'WORKER', event.message || 'Reader worker could not start.');
      worker.onmessage = async (/** @type {MessageEvent<import('./reader-types.js').WorkerResult>} */ event) => {
        if (!isActive(job)) return;
        const result = event.data;
        if ('stage' in result) { status.textContent = result.stage === 'parse' ? '原稿を解析しています…' : '画像を読み込んでいます…'; notify(result.stage); return; }
        if (!result.ok) { fail(job,result.code,`${result.line ? `${result.line}行目: ` : ''}${result.message}`); return; }
        try {
          const assets = new Map(result.assets.map(a => [a.path, win.URL.createObjectURL(new Blob([a.bytes], { type:a.mime }))]));
          job.urls = [...assets.values()];
          const article = renderBook(result.book, { document:doc, resolveAsset:path => { const url = assets.get(path); if (!url) throw new Error(`Missing asset ${path}`); return url; } });
          await Promise.all([...article.querySelectorAll('img')].map(img => img.decode()));
          if (!isActive(job)) return;
          if (current) revoke(current.urls);
          readingAnchor = null;
          current = { book:result.book, source:result.source, warnings:result.warnings, urls:job.urls }; job.urls = [];
          const metadata = result.book.metadata, title = get('book-title');
          title.textContent = metadata.title; title.lang = metadata.lang; title.dir = metadata.direction;
          get('book-author').textContent = metadata.author ?? '';
          get('mode-label').textContent = `${metadata.lang} · ${metadata.direction} · ${metadata.writingMode}`;
          viewport.replaceChildren(article);
          const list = doc.createElement('ol');
          for (const entry of result.book.toc) {
            const li = doc.createElement('li'), a = doc.createElement('a');
            a.href = `#${entry.id}`; a.textContent = entry.label; a.lang = metadata.lang; a.dir = metadata.direction;
            a.style.paddingInlineStart = `${(entry.level-1)*10}px`; li.append(a); list.append(li);
          }
          get('toc').replaceChildren(list); get('source').textContent = result.source;
          get('warnings').textContent = result.warnings.map(w => `${w.code}: ${w.message}`).join('\n');
          reader.hidden = false; viewport.scrollTop = 0; viewport.scrollLeft = 0;
          active = null; worker.terminate(); job.worker = null; setBusy(false);
          status.textContent = `${metadata.title} を開きました。${result.book.toc.length}項目の目次。`;
          job.resolve({ status:'opened' }); notify('open');
        } catch (error) { fail(job,'IMAGE', error instanceof Error ? error.message : String(error)); }
      };
      worker.postMessage({ kind:'files', files });
    } catch (error) { fail(job,'LOAD', error instanceof Error ? error.message : String(error)); }
  }
  /** Load host-provided files, optionally acquired by an abortable host callback.
   * @param {Publication} publication @returns {Promise<OpenResult>}
   */
  function open(publication) {
    if (destroyed) return Promise.resolve({ status:'destroyed' });
    const revision = ++operation; stop('cancelled');
    if (destroyed) return Promise.resolve({ status:'destroyed' });
    if (revision !== operation) return Promise.resolve({ status:'cancelled' });
    errorBox.hidden = true; status.textContent = '本を読み込んでいます…'; setBusy(true);
    return new Promise(resolve => {
      const job = { controller:new AbortController(), worker:null, urls:[], resolve }; active = job;
      notify('loading'); void begin(job, publication);
    });
  }
  function cancel() {
    if (destroyed || !active) return;
    const revision = ++operation; stop('cancelled');
    if (destroyed || revision !== operation) return;
    setBusy(false); status.textContent = '読み込みを中断しました。'; notify('cancelled');
  }
  function close() {
    if (destroyed) return;
    const revision = ++operation; stop('cancelled');
    if (destroyed || revision !== operation) return;
    if (current) revoke(current.urls); current = null; readingAnchor = null; clearDownloads();
    viewport.replaceChildren(); get('toc').replaceChildren(); get('source').textContent = ''; get('warnings').textContent = '';
    reader.hidden = true; errorBox.hidden = true; setBusy(false); status.textContent = '本を閉じました。次の本を選んでください。';
    element.focus({ preventScroll:true }); notify('closed');
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; ++operation; stop('destroyed'); if (current) revoke(current.urls); current = null; readingAnchor = null;
    clearDownloads(); events.abort(); resize.disconnect(); viewport.replaceChildren(); reader.replaceChildren(); root.replaceChildren(); notify('destroyed'); element.remove();
  }
  /** @param {string} text @param {string} name @param {string} type */
  function download(text,name,type) {
    const url = win.URL.createObjectURL(new Blob([text],{type})), a = doc.createElement('a');
    a.href = url; a.download = name; root.append(a); a.click(); a.remove();
    const timer = win.setTimeout(()=>{ win.URL.revokeObjectURL(url); downloads.delete(timer); },1000); downloads.set(timer,url);
  }
  get('cancel').addEventListener('click',cancel,{signal:events.signal});
  get('close-book').addEventListener('click',close,{signal:events.signal});
  font.addEventListener('input',()=>setOptions({fontSize:Number(font.value)}),{signal:events.signal});
  lineHeight.addEventListener('input',()=>setOptions({lineHeight:Number(lineHeight.value)}),{signal:events.signal});
  fontFamily.addEventListener('change',()=>setOptions({fontFamily:/** @type {'mincho'|'gothic'} */(fontFamily.value)}),{signal:events.signal});
  theme.addEventListener('change',()=>setOptions({theme:/** @type {'paper'|'night'} */(theme.value)}),{signal:events.signal});
  get('download-source').addEventListener('click',()=>{if(current) download(current.source,'book.md','text/markdown;charset=utf-8');},{signal:events.signal});
  get('download-ast').addEventListener('click',()=>{if(current) download(JSON.stringify(current.book,null,2),'book.ast.json','application/json');},{signal:events.signal});
  root.addEventListener('click',event=>{
    const target = event.target instanceof win.Element ? event.target.closest('a') : null;
    const href = target?.getAttribute('href');
    if (href && /^#h-[1-9][0-9]*$/.test(href)) { event.preventDefault(); navigate(href.slice(1)); }
  },{signal:events.signal});
  return { element, open, cancel, close, destroy, setOptions, navigate, advance, getPosition,
    getSnapshot: () => current ? { source:current.source, book:structuredClone(current.book), warnings:structuredClone(current.warnings) } : null };
}
