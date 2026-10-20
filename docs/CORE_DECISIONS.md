# Phase 1: sample-derived Core decisions

2026-10-20 · experimental, local draft · follows Issue #9 and PHASE1_WORKING_DIRECTION.md.

The three purpose-written manuscripts were made before the parser. They are a design/conformance corpus, not evidence that every ordinary book fits this Core. The draft is **0.1.0-draft.1**, identified in manuscripts as `0.1-draft.1`. No compatibility or release promise is made.

| Need observed in samples | Decision | Evidence |
| --- | --- | --- |
| Short prose, notes and chapter/section navigation | CommonMark 0.31.2 structure; derive TOC, no authored TOC | All three books, each with h1/h2/h1 |
| English quotation, a short list, emphasis and an example in code | Keep the existing CommonMark semantic vocabulary; no private prose parser | `horizontal/book.md` |
| Identity separate from first chapter | Required version, title, language; optional author | All samples |
| A book without cover; a book with a distinct cover | Explicit optional cover + cover-alt, never infer the first image | Horizontal vs vertical |
| Illustrated prose | Local PNG/JPEG/WebP with alt; no placement/caption language | All samples |
| Internal return/next links | Sequential document-wide `#h-N` heading targets | All samples |
| Japanese group ruby and adjacent annotated words | `｜base《annotation》`, one plain base ↔ one plain reading; explicit escape | Vertical |
| Vertical text is not RTL text | Independent language, direction and writing mode | Vertical uses `ja`, `ltr`, `vertical-rl` |
| Arabic with a Latin name, URL, room number and Hebrew word | A fixed atomic text run `{{lang|dir|text}}`; map to isolated text | RTL |
| Raw source should remain readable | One UTF-8 book.md and relative assets; no manifest, build step or ZIP required | All samples |

## Why a fixed text run entered Core

A document-level `lang` and `direction` alone cannot preserve the intent of the RTL sample. The URL includes neutral punctuation and a Latin run; the Hebrew word also changes language. Invisible control characters alone would not be a human-writable explanation of that intent. A single fixed three-field construct records language and isolation without a generic attribute system or arbitrary HTML. It is deliberately plain text: no nested markup, links or ruby inside the run. A run may be a link label, or be wrapped in emphasis.

This is a tradeoff to test, not a claim that the syntax is final. Real multilingual passages containing ruby may justify revisiting its atomicity; block language overrides are deferred. No language-to-direction lookup is permitted.

## CommonMark cost and boundary

The profile inherits all CommonMark 0.31.2 block/inline structures, with **raw HTML rejected**, plus restrictions on heading hierarchy, image alt content and destinations. This includes setext headings, references and indented code: accepting the existing grammar is less ambiguous than inventing another lookalike subset and silently reinterpreting it. The implementation delegates Markdown parsing to a pinned CommonMark-capable library; YomPUB's additional grammar is the header and two atomic inline constructs.

This is small as a *delta to a mature standard*, not a claim that CommonMark itself is a tiny standalone grammar. An independent implementation can reuse another CommonMark parser. Whether the author-facing vocabulary should shrink further remains an explicit evaluation question.

Unknown Markdown extensions have no special semantics. For example, `~~text~~` is ordinary text, and a pipe table is ordinary prose under CommonMark. Unsupported raw HTML, wrong versions, broken Core markers and missing internal targets fail explicitly; they are never silently stripped.

## Deferred, with reasons

- Footnotes, captions, tables, math, bibliography, index, bouten and tate-chu-yoko: these three books do not require them. This is not a conclusion that nonfiction never needs them. The next corpus should include a real essay with notes before expansion.
- ZIP packaging, multi-file spine, custom heading IDs: no need in a one-file book. Sequential IDs are deterministic but change when earlier headings are inserted; authors must update links then.
- Publication/store metadata: no observed need beyond title/author/language.
- Audio/video, arbitrary HTML/CSS/JS, fixed layout, fonts, DRM, quizzes, embedded apps: outside initial Core.
- Authoring app (Issue #8), library manager, accounts, annotations, export pipeline: outside this slice.

## Markua comparison outcome retained

The human continuation gate is closed; this work does not reopen it. Markua remains a conversion/prior-art target. Our delta is a bounded exchange model with explicit independent language/direction/writing mode, ruby and isolated runs, without a broad publishing language. Existing research remains under `docs/research/`.

## Next meaningful gate

Have an independent implementation consume `docs/spec/0.1-draft.1.md` and the data-only conformance fixtures, then compare AST semantics. Also read a longer Japanese passage and ask native Arabic/Hebrew readers about mixed punctuation. The present reference parser/viewer plus same-author tests do **not** constitute independent implementation evidence.
