import { decodeSource, parseBook, YompubError, MAX_SOURCE_BYTES } from '../src/core.mjs';
import { imageType, MAX_ASSET_BYTES, MAX_TOTAL_ASSET_BYTES } from '../src/assets.mjs';
/** @typedef {{kind:'files', files:import('../src/reader-types.js').InputFile[]}} LoadRequest */
/** @param {MessageEvent<LoadRequest>} event */
self.onmessage = async event => {
  try {
    const request = event.data;
    /** @type {(path:string) => Promise<Uint8Array>} */ let read;
    {
      const files = request.files;
      if (request.kind !== 'files' || !Array.isArray(files)) throw new YompubError('FILE', 'Expected a list of publication files.');
      if (files.length > 2000) throw new YompubError('LIMIT', 'Select a book folder with at most 2000 files.');
      const map = new Map();
      for (const entry of files) {
        if (!entry || typeof entry.path !== 'string' || !(entry.file instanceof Blob)) throw new YompubError('FILE', 'Each entry must contain a relative path and a Blob or File.');
        const {path, file} = entry;
        if (map.has(path)) throw new YompubError('FILE', `Duplicate file: ${path}`);
        map.set(path, file);
      }
      read = async path => {
        const file = map.get(path);
        if (!file) throw new YompubError('MISSING_FILE', `Missing ${path}. Select the folder containing book.md and its images.`);
        if (file.size > (path === 'book.md' ? MAX_SOURCE_BYTES : MAX_ASSET_BYTES)) throw new YompubError('LIMIT', `File too large: ${path}`);
        return new Uint8Array(await file.arrayBuffer());
      };
    }
    const source = decodeSource(await read('book.md'));
    self.postMessage({ stage:'parse' });
    const { book, warnings } = parseBook(source);
    self.postMessage({ stage:'assets' });
    const assets = [];
    let total = 0;
    for (const path of book.assets) {
      const bytes = await read(path);
      total += bytes.byteLength;
      if (total > MAX_TOTAL_ASSET_BYTES) throw new YompubError('LIMIT', 'Referenced images exceed 40 MiB.');
      assets.push({ path, mime: imageType(path, bytes), bytes: bytes.buffer });
    }
    self.postMessage({ ok: true, source, book, warnings, assets });
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error));
    self.postMessage({ ok: false, code: e instanceof YompubError ? e.code : 'READ', message: e.message, line: e instanceof YompubError ? e.line : undefined });
  }
};
