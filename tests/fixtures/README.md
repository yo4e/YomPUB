# Conformance data

`conformance.json` is data, not executable test code. For each entry, construct the source exactly as:

```text
---
yompub: 0.1-draft.1
title: Test
lang: en
---

# Chapter

{body}
```

Replace `{body}` with the entry's `body` string and append one LF. For `inline` entries, compare the first paragraph after the injected heading against that inline array. `error` entries must reject the source with the named diagnostic category. The normative prose describes the meaning of each failure; implementations need not use the same human-readable message. Header/encoding/file tests are additionally exercised in `tests/core.test.mjs` and `tests/local.test.mjs`.

`horizontal.ast.json`, `vertical.ast.json`, `rtl.ast.json` are the full normalized semantic projections for the corresponding `samples/<name>/book.md`. They were emitted by the reference parser, then inspected with explicit checks on title, direction, ruby/base/reading, heading-derived TOC, links, alt/cover and language runs. They are regression fixtures, not an independent implementation result. JSON object-key order is immaterial.

`commonmark-0.31.2.json` is the upstream 652-example baseline for the underlying Markdown engine, under its separate CC BY-SA 4.0 terms; see `THIRD_PARTY_NOTICES.md`. The YomPUB profile deliberately rejects some of these otherwise-valid CommonMark documents, so this baseline is tested separately from Core acceptance.
