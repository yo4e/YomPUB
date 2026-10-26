import { createReader } from '../src/reader.mjs';
import { sampleFiles } from './sample-files.mjs';
/** Demo handles, exported for inspection; not part of the reader API. */
export const readers = new Map();
for (const panel of document.querySelectorAll('[data-panel]')) {
  const name = /** @type {HTMLElement} */(panel).dataset.panel;
  const mount = /** @type {HTMLElement} */(panel.querySelector('.mount'));
  const select = /** @type {HTMLSelectElement} */(panel.querySelector('select'));
  const eventLabel = /** @type {HTMLElement} */(panel.querySelector('.event'));
  const create = () => { if (!readers.has(name)) readers.set(name,createReader(mount)); };
  const open = () => { create(); void readers.get(name).open((/** @type {AbortSignal} */ signal) => sampleFiles(select.value,signal)); };
  mount.addEventListener('yompub-state',event=>{ eventLabel.textContent = /** @type {CustomEvent} */(event).detail.state; });
  panel.querySelector('[data-open]')?.addEventListener('click',open);
  panel.querySelector('[data-create]')?.addEventListener('click',create);
  panel.querySelector('[data-destroy]')?.addEventListener('click',()=>{readers.get(name)?.destroy();readers.delete(name);eventLabel.textContent='destroyed';});
  open();
}
let count=0;
document.getElementById('host-button')?.addEventListener('click',()=>{const output=document.getElementById('host-count');if(output)output.textContent=String(++count);});
window.addEventListener('pagehide',event=>{
  for(const reader of readers.values()) { if(event.persisted) reader.cancel(); else reader.destroy(); }
  if(!event.persisted) readers.clear();
});
