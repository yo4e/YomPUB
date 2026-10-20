// Test infrastructure only. Playwright 1.61.1 starts an evaluate() that installs
// an input listener, then sends the native file-selection command without an
// acknowledgement that the listener exists. Linux WebKit can dispatch first:
// the book loads, but setInputFiles never resolves. Wait for a JSHandle to an
// object containing the event promise before selecting files, then await it.
// Keep this narrowly guarded and remove it once the upstream race is fixed.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('playwright-core/package.json');
const { version } = JSON.parse(await readFile(packagePath, 'utf8'));
if (version !== '1.61.1') throw new Error('Reassess the directory-input race patch for this Playwright version.');
const bundlePath = join(dirname(packagePath), 'lib/coreBundle.js');
const source = await readFile(bundlePath, 'utf8');
const original = `          const waitForInputEvent = localDirectory ? this.evaluate((node) => new Promise((fulfill) => {
            node.addEventListener("input", fulfill, { once: true });
          })).catch(() => {
          }) : Promise.resolve();
          await this._page.delegate.setInputFilePaths(progress2, retargeted, localPathsOrDirectory);
          await progress2.race(waitForInputEvent);`;
const replacement = `          // YomPUB test harness: acknowledge listener installation before selection.
          const inputEvent = localDirectory ? await progress2.race(this.evaluateHandle((node) => ({
            promise: new Promise((fulfill) => node.addEventListener("input", fulfill, { once: true }))
          }))) : null;
          try {
            await this._page.delegate.setInputFilePaths(progress2, retargeted, localPathsOrDirectory);
            if (inputEvent) await progress2.race(inputEvent.evaluate((event) => event.promise));
          } finally {
            await inputEvent?.dispose();
          }`;
if (source.includes(replacement)) {
  console.log('Playwright directory-input listener patch already applied.');
} else {
  if (source.split(original).length !== 2) throw new Error('Playwright upload implementation changed; refusing an unverified patch.');
  await writeFile(bundlePath, source.replace(original, replacement));
  console.log('Applied test-only Playwright directory-input listener patch.');
}
