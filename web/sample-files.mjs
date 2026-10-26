/** Demo-only acquisition adapter. The reader itself never fetches manuscripts.
 * @param {string} name @param {AbortSignal} signal
 * @returns {Promise<import('../src/reader-types.js').InputFile[]>}
 */
export async function sampleFiles(name, signal) {
  if (!['horizontal','vertical','rtl'].includes(name)) throw new Error('Unknown sample.');
  const index = await fetch(new URL('samples/index.json',import.meta.url),{signal});
  if (!index.ok) throw new Error(`Sample index: ${index.status}`);
  const manifest = await index.json();
  const base = new URL(`samples/${name}/`,import.meta.url);
  return Promise.all(/** @type {string[]} */(manifest[name]).map(async path => {
    const url = new URL(path,base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.search || url.hash) throw new Error('Invalid sample path.');
    const response = await fetch(url,{signal});
    if (!response.ok) throw new Error(`Could not read sample (${response.status}).`);
    return {path,file:await response.blob()};
  }));
}
