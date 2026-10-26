import { createReader } from '../src/reader.mjs';
import { sampleFiles } from './sample-files.mjs';
/** @param {string} id @returns {HTMLElement} */
const byId = id => { const node = document.getElementById(id); if (!node) throw new Error(id); return node; };
const mount = byId('reader-mount'), reader = createReader(mount), fileStatus = byId('file-status');
mount.addEventListener('yompub-state', event => {
  const {state,hasBook} = /** @type {CustomEvent} */ (event).detail;
  mount.dataset.book = String(hasBook);
  if (state === 'closed') {
    for (const id of ['folder','manuscript']) /** @type {HTMLInputElement} */(byId(id)).value = '';
    /** @type {HTMLButtonElement|null} */(document.querySelector('[data-sample]'))?.focus();
  }
});
for (const button of document.querySelectorAll('button[data-sample]')) {
  button.addEventListener('click', () => { fileStatus.textContent = ''; void reader.open(signal => sampleFiles(/** @type {HTMLElement} */(button).dataset.sample ?? '',signal)); });
}
/** @param {HTMLInputElement} input */
function bindFileInput(input) {
  input.addEventListener('change', () => {
    const files = [...(input.files ?? [])];
    // Capture relative paths before File structured cloning (WebKit drops them).
    if (files.length) { fileStatus.textContent = ''; void reader.open(files.map(file => ({ file, path:file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name }))); }
  });
  input.addEventListener('cancel', () => { fileStatus.textContent = 'ファイル選択を中断しました。'; });
}
for (const id of ['folder','manuscript']) bindFileInput(/** @type {HTMLInputElement} */(byId(id)));
for (const button of document.querySelectorAll('button[data-open-input]')) {
  button.addEventListener('click', () => {
    const previous = byId(/** @type {HTMLElement} */(button).dataset.openInput ?? '');
    // A fresh control also supports unchanged directory selections in WebKit.
    const input = document.createElement('input');
    for (const attribute of previous.attributes) input.setAttribute(attribute.name, attribute.value);
    previous.replaceWith(input); bindFileInput(input); input.click();
  });
}
window.addEventListener('pagehide',event=>{ if(event.persisted) reader.cancel(); else reader.destroy(); });
