import { YompubError } from './core.mjs';
export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_ASSET_BYTES = 40 * 1024 * 1024;
/** Minimal signature validation; actual decode is performed by the browser.
 * @param {string} path @param {Uint8Array} bytes
 */
export function imageType(path, bytes) {
  if (bytes.byteLength > MAX_ASSET_BYTES) throw new YompubError('LIMIT', `Image exceeds 10 MiB: ${path}`);
  /** @param {...number} signature */
  const starts = (...signature) => signature.every((b, i) => bytes[i] === b);
  if (/\.png$/i.test(path) && starts(137, 80, 78, 71, 13, 10, 26, 10)) return 'image/png';
  if (/\.jpe?g$/i.test(path) && starts(255, 216, 255)) return 'image/jpeg';
  if (/\.webp$/i.test(path) && starts(82, 73, 70, 70) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  throw new YompubError('ASSET_TYPE', `Image signature does not match PNG/JPEG/WebP: ${path}`);
}
