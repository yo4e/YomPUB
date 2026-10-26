// The catalog belongs to the sample host, not to any one reader load. Reusing
// it avoids aborting/refetching the same URL during rapid switches in WebKit.
/** @type {Promise<Record<string,string[]>> | null} */
let catalog = null;
function sampleIndex() {
  if (!catalog) catalog = (async () => {
    const response = await fetch(new URL('samples/index.json',import.meta.url));
    if (!response.ok) throw new Error(`Sample index: ${response.status}`);
    return /** @type {Record<string,string[]>} */ (await response.json());
  })().catch(error => { catalog = null; throw error; });
  return catalog;
}

/** Demo-only acquisition adapter. The reader itself never fetches manuscripts.
 * @param {string} name @param {AbortSignal} signal
 * @returns {Promise<import('../src/reader-types.js').InputFile[]>}
 */
export async function sampleFiles(name, signal) {
  if (!['horizontal','vertical','rtl'].includes(name)) throw new Error('Unknown sample.');
  signal.throwIfAborted();
  const manifest = await sampleIndex();
  signal.throwIfAborted();
  const base = new URL(`samples/${name}/`,import.meta.url);
  return Promise.all(/** @type {string[]} */(manifest[name]).map(async path => {
    const url = new URL(path,base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.search || url.hash) throw new Error('Invalid sample path.');
    const response = await fetch(url,{signal});
    if (!response.ok) throw new Error(`Could not read sample (${response.status}).`);
    return {path,file:await response.blob()};
  }));
}
