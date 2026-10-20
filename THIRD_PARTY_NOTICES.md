# Third-party notices

## CommonMark conformance data

`tests/fixtures/commonmark-0.31.2.json` is downloaded without modification from <https://spec.commonmark.org/0.31.2/spec.json> (2026-10-20), the examples accompanying the CommonMark 0.31.2 specification by John MacFarlane. The CommonMark specification is licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). This imported fixture retains those terms, separate from this project's MIT license. Its full text is available at <https://creativecommons.org/licenses/by-sa/4.0/legalcode>.

The test normalizes only serialization whitespace inside an empty blockquote, in examples 218, 239 and 240; it does not modify the imported JSON. Passing this baseline means the pinned underlying parser matched the 652 inherited examples after that normalization. It is not a claim that the restricted YomPUB profile accepts all CommonMark documents.

## Runtime Markdown parser

`markdown-it` and its transitive dependencies are installed from the pinned lockfile. Their licenses are in `node_modules/<package>/LICENSE*`. The modified text-scanner rule in `src/core.mjs` is derived from markdown-it's MIT-licensed text rule:

Copyright (c) 2014 Vitaly Puzrin, Alex Kocharin.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The development/browser tooling is not part of the manuscript format.
