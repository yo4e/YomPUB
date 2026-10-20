import { join } from 'node:path';
import { loadLocalBook } from '../src/local.mjs';

// Publication is opt-in. Do not copy arbitrary folders, unreferenced images,
// notes or local manuscripts that happen to live beside the shipped samples.
const names = ['horizontal', 'vertical', 'rtl'];
/** @param {string} root @returns {Promise<string[]>} */
export async function publicSampleFiles(root) {
  const files = [];
  for (const name of names) {
    const { book } = await loadLocalBook(join(root, name, 'book.md'));
    files.push(...['book.md', ...book.assets].map(path => `${name}/${path}`));
  }
  return files;
}
