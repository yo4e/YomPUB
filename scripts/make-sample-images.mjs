// Deterministic, original geometric test fixtures. No font/network dependency.
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
function crc32(/** @type {Uint8Array} */ bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(/** @type {string} */ type, /** @type {Buffer} */ data) {
  const t = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([size, t, data, crc]);
}
function fixture(/** @type {number} */ w, /** @type {number} */ h, /** @type {boolean} */ cover) {
  const data = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let rgb = cover ? [23, 42, 64] : [241, 235, 221];
    if ((x-w*.68)**2 + (y-h*.23)**2 < (w*.11)**2) rgb = [226, 181, 89];
    if (x > w*.16 && x < w*.2 && y > h*.3 && y < h*.72) rgb = [63, 86, 107];
    if (x > w*.12 && x < w*.24 && y > h*.28 && y < h*.4) rgb = [226, 181, 89];
    for (let j = 0; j < 3; j++) if (Math.abs(y - (h*(.72+j*.08) + Math.sin(x/w*12)*h*.018)) < 3 && x > w*.08 && x < w*.92) rgb = cover ? [210, 226, 227] : [53, 104, 127];
    for (let c = 0; c < 3; c++) data[y*(w*3+1)+1+x*3+c] = rgb[c];
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(w); header.writeUInt32BE(h,4); header[8]=8; header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);
}
for (const name of ['horizontal','vertical','rtl']) await writeFile(`samples/${name}/assets/harbour.png`, fixture(600,320,false));
await writeFile('samples/vertical/assets/cover.png',fixture(400,560,true));
