#!/usr/bin/env node
import { loadLocalBook } from './local.mjs';
import { YompubError } from './core.mjs';
const [command, ...paths] = process.argv.slice(2);
if (!['validate', 'ast'].includes(command) || !paths.length || (command === 'ast' && paths.length !== 1)) {
  console.error('Usage: node src/cli.mjs validate <book.md>... | ast <book.md>');
  process.exitCode = 2;
} else {
  for (const path of paths) {
    try {
      const { book, warnings } = await loadLocalBook(path);
      for (const w of warnings) console.error(`WARNING ${w.code}: ${w.message}`);
      if (command === 'ast') console.log(JSON.stringify(book, null, 2));
      else console.log(`OK ${path}: ${book.toc.length} headings, ${book.assets.length} asset signatures (${book.format}; image decode is checked by the viewer)`);
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      const code = e instanceof YompubError ? e.code : 'IO';
      const line = e instanceof YompubError && e.line ? `:${e.line}` : '';
      console.error(`ERROR ${path}${line} ${code}: ${e.message}`);
      process.exitCode = 1;
    }
  }
}
