import { readFile, lstat, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { decodeSource, parseBook, YompubError, MAX_SOURCE_BYTES } from './core.mjs';
import { imageType, MAX_ASSET_BYTES, MAX_TOTAL_ASSET_BYTES } from './assets.mjs';

/** @param {string} path @param {number} max */
async function boundedRead(path, max) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new YompubError('FILE', `Expected a regular, non-symlink file: ${path}`);
  if (stat.size > max) throw new YompubError('LIMIT', `File exceeds implementation limit: ${path}`);
  return readFile(path);
}
/** @param {string} manuscript */
export async function loadLocalBook(manuscript) {
  const path = resolve(manuscript);
  const root = await realpath(dirname(path));
  const parsed = parseBook(decodeSource(await boundedRead(path, MAX_SOURCE_BYTES)));
  let total = 0;
  for (const name of parsed.book.assets) {
    let current = root;
    for (const segment of name.split('/')) {
      current = resolve(current, segment);
      if ((await lstat(current)).isSymbolicLink()) throw new YompubError('ASSET_SYMLINK', `Symlink assets are unsupported: ${name}`);
    }
    const canonical = await realpath(current);
    const rel = relative(root, canonical);
    if (rel === '..' || rel.startsWith(`..${sep}`) || resolve(root, rel) !== canonical) throw new YompubError('ASSET_PATH', `Image is outside the book: ${name}`);
    const bytes = await boundedRead(canonical, MAX_ASSET_BYTES);
    imageType(name, bytes);
    total += bytes.length;
    if (total > MAX_TOTAL_ASSET_BYTES) throw new YompubError('LIMIT', 'Referenced images exceed 40 MiB.');
  }
  return parsed;
}
