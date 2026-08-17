# Global writing systems and international text requirements

Status: **Phase 0 research / non-normative**

This document is research input for YomPUB Phase 1. It does not define YomPUB syntax or metadata field names.

Research snapshot: **2026-08-18**. Unicode references use the current Unicode 17.0 generation where available.

## 1. Executive summary

YomPUB does **not** need its own bidi algorithm, shaping engine, line breaker, glyph-orientation table, hyphenator, or ruby typesetter. Modern Unicode, browser/platform text engines, fonts, HTML, and CSS already solve most of those jobs more correctly than a tiny book format could.

But delegation only works if the source preserves the semantic inputs those systems need. The minimum international-text responsibilities that YomPUB likely needs to carry are:

1. **Unicode text in logical order**, without naive destructive transformation.
2. **The human language of the document and meaningful language changes inside it**, using standard language tags rather than a YomPUB vocabulary.
3. **A base text direction when it cannot safely be inferred**, separate from language.
4. **The intended writing mode** where vertical versus horizontal composition is part of the publication's reading intent.
5. **A minimal way to preserve exceptional inline direction/isolation semantics** if Core promises robust mixed bidi text; exact author syntax remains undecided.
6. **A semantic annotation relationship** if ruby/pronunciation aids are Core; exact presentation should remain renderer territory.
7. **Structural boundaries** — paragraphs, headings, spans/annotations — that let rendering and assistive technology apply language, direction, segmentation, and pronunciation correctly.

The strongest negative rule is equally important:

> YomPUB tools must never treat Unicode code points as independent printable “characters” when transforming prose.

A user-perceived character can be multiple code points; Arabic and Indic scripts rely on contextual shaping and joining controls; combining marks belong with bases; bidirectional display order is not storage order; Thai and other scripts do not expose all word boundaries with spaces; vertical orientation depends on character properties and rendering rules. Naive slicing, reversal, punctuation rewriting, compatibility normalization, or hand-written line breaking will corrupt real text.

### The key boundary

**Core must preserve meaning and reading intent. The viewer must perform typography.**

A useful first approximation is:

- Core says “this text is Arabic, base RTL, horizontal” or “this book is Japanese, vertical right-to-left”; 
- Unicode/HTML/CSS/platform engines determine joining, bidi reordering, glyph choice, punctuation orientation, line breaking, and font fallback;
- Core only adds local semantic exceptions when those exceptions cannot be recovered from the Unicode text and document structure.

### Important correction to a tempting simplification

**Language is not direction.** W3C internationalization guidance treats the two independently. A language may be written in more than one script/direction, and mixed-direction content exists inside almost every RTL publication because numbers, URLs, filenames, product names, and Latin fragments are LTR. A source format should therefore not define direction purely as a lookup from language.

### Annotation conclusion

A tiny generic **base text + annotation text** relationship is realistic for common simple ruby, including Japanese pronunciation ruby and the semantic relation behind Chinese bopomofo/zhuyin annotation. But a universal interlinear-annotation system with multiple annotation levels, arbitrary spanning, glosses, and detailed placement would quickly stop being tiny. Phase 1 should test one simple ruby relation as a Core candidate and leave advanced annotation presentation/structures to renderers or extensions.

## 2. Responsibility boundary

| Concern | YomPUB Core must express | Viewer/rendering engine must implement | Unicode/platform should handle automatically | Optional extension/tool concern |
|---|---|---|---|---|
| Unicode storage | Preserve valid Unicode text in logical order; define encoding (likely UTF-8) | Decode safely and preserve text | Character properties and standard algorithms | Encoding conversion/import cleanup |
| Default human language | Preserve authorial language tag | Map to target `lang`/platform language APIs | Language-sensitive services may use it | Language detection as an authoring aid, never silent truth |
| Language changes | Preserve meaningful block/inline changes | Apply language to DOM/accessibility/text services | Font fallback, speech, segmentation may consume it | Automatic detection/linting |
| Base text direction | Preserve LTR/RTL/auto-like intent when needed; exact values/syntax TBD | Set paragraph/document base direction | UBA resolves mixed runs once base level is known | Authoring helper may infer/suggest |
| Bidi mixed text | Preserve logical text and explicit semantic isolation/override where authored | Map to safe platform mechanisms such as HTML `dir`/`bdi`/CSS | Unicode Bidirectional Algorithm | Linter for suspicious bidi controls/security |
| Writing mode | Preserve horizontal/vertical reading intent | Map to CSS/platform writing modes | Unicode Vertical Orientation contributes character defaults | Advanced local orientation controls |
| Glyph shaping | Nothing script-specific beyond preserving Unicode text/language controls | Use shaping/font stack | Fonts/platform shaping data | Embedded-font packaging if ever needed |
| Combining marks / clusters | Never split/reorder them naively | Operate on appropriate text boundaries | UAX #29 grapheme segmentation; font positioning | Editor diagnostics |
| Normalization | Define preservation/conformance policy carefully; do not use compatibility normalization as cleanup | Compare/search canonically where appropriate | UAX #15 normalization algorithms | Optional canonical normalization tool with explicit behavior |
| Line breaking | Preserve language and text; do not author physical line breaks as layout | Choose actual line wraps for viewport | UAX #14/CSS Text provides break opportunities and tailoring basis | Hyphenation dictionaries, publisher style profiles |
| CJK no-space text | Preserve text/language/punctuation | Apply appropriate line-break rules | Unicode/CSS/browser rules | Strict/loose typography profiles later |
| Thai/Lao/Khmer segmentation | Preserve language accurately | Use lexical/script-aware breaking | Platform segmenters may supply dictionaries/models | Specialized segmenter fallback |
| Vertical punctuation/orientation | Preserve writing mode and Unicode characters | Apply orientation/text-orientation rules | UAX #50 character orientation data | Explicit local exception if real books require it |
| Tate-chu-yoko-like cases | Not necessarily initial Core | Render when semantic/local instruction exists | CSS may provide `text-combine-upright` behavior | Strong extension candidate if corpus requires it |
| Ruby/pronunciation relation | Likely preserve simple base↔annotation relation if selected for Core | Position annotation, size/spacing/collision handling | Font subsystem positions glyphs | Multi-level/interlinear annotations, styling options |
| Accessibility | Preserve language, structure, logical order, alt text, annotation semantics | Expose semantic accessibility tree | Screen-reader/platform services consume semantics | Accessibility audit/certification metadata |
| Font selection/fallback | Do not hardcode language meaning as font choice | Choose fonts/fallbacks | OS/font stack | Optional packaged-font feature |

## 3. Writing-system risk map

| Case | Examples | Special behavior | Naive failure | Likely YomPUB requirement |
|---|---|---|---|---|
| Horizontal LTR | English, Spanish, Vietnamese | Mostly familiar paragraph direction; still uses combining marks and language-specific breaking | Assuming ASCII/one-code-point characters; losing diacritics | Unicode preservation + language metadata |
| Horizontal RTL | Arabic, Hebrew, Persian, Urdu | Paragraph base RTL; numbers and many embedded fragments remain LTR | Reversing strings; mirroring storage order; deriving direction only from language | Explicit base-direction semantics + UBA delegation |
| Mixed bidi | Arabic/Hebrew sentence containing `https://...`, filenames, numbers, Latin names | Multiple directional runs and neutral punctuation; isolation often matters | Punctuation jumps sides; surrounding text changes order; spoofing/confusion | Logical order + safe inline direction/isolation model |
| Vertical Japanese | Japanese | Lines progress vertically; punctuation/glyph orientation changes; Latin/numbers may rotate or remain upright | Rotating the whole canvas/string; manually substituting punctuation | Writing-mode intent + renderer delegation to CSS/UAX #50 |
| Other vertical modes | Chinese, Mongolian and historical/less-common contexts | Script-specific native orientations and block progression differ | Treating “vertical” as one universal rotation | Writing-mode vocabulary based on established standards, not Japanese-only assumptions |
| Arabic complex shaping | Arabic-script languages | Contextual joining, mandatory forms/ligatures, ZWJ/ZWNJ behavior, diacritics | Shaping each code point separately; inserting spaces; splitting joining sequences | Preserve code-point order/controls; mature shaper/font required |
| Indic/Brahmic shaping | Hindi/Marathi (Devanagari), Bangla, Malayalam, etc. | Combining marks, conjuncts, reordering in glyph display, join controls | Cursor/truncation by code point; styling/splitting inside clusters | Grapheme/script-aware processing; renderer/shaper responsibility |
| Combining marks | Vietnamese, Arabic vocalization, many scripts | Base + one/more combining marks form a user-perceived unit | Delete/truncate mark separately; corrupt normalization | Never-naive slicing; canonical-equivalence-aware tooling |
| CJK no-space breaking | Japanese, Chinese | Many break opportunities are character/punctuation dependent rather than spaces | Only wrapping at ASCII spaces or breaking forbidden punctuation positions | Language + UAX #14/CSS Text aware renderer |
| Dictionary-like breaking | Thai, Lao, Khmer | Word boundaries not routinely written with spaces; lexical analysis may be needed | Break at arbitrary code-point positions or never wrap | Correct language metadata + platform/lexical breaker |
| Ruby / furigana | Japanese | Annotation linked to base run; mono/group distribution and vertical placement vary | Flattening ruby into parentheses loses semantic relation/accessibility/render flexibility | Preserve simple base↔annotation semantics if Core |
| Bopomofo / zhuyin | Mandarin Chinese | Phonetic annotation may appear inter-character/vertical with tone-mark positioning | Assuming all ruby is visually “small text above a word” | Same semantic relation may work; renderer needs bopomofo-specific layout |
| Mixed-language passages | Any multilingual book | Speech, fonts, hyphenation and segmentation can change at span/block boundaries | One book-level language applied everywhere | Inline/block language semantics |

## 4. Metadata requirements

Field names are deliberately **not** proposed here. These are semantic requirements.

### 4.1 Language

A renderer needs a default human language for the publication/content and needs to know meaningful language changes within text where they affect interpretation or accessibility.

Use **BCP 47 language tags** rather than a private code list. This supports language, script, and region subtags when necessary.

Why this cannot be purely optional decoration:

- CSS line-breaking behavior can be language-sensitive;
- screen readers use language to select pronunciation rules/voices;
- font/glyph selection may depend on language;
- hyphenation and segmentation depend on language;
- WCAG accessibility requires the default language and, at Level AA, language of parts to be programmatically determinable in applicable cases.

A practical tiny model could have a publication/document default plus scoped overrides. Exact syntax and whether every span-level override is Core remain Phase 1 decisions.

### 4.2 Base direction

The Unicode Bidirectional Algorithm determines visual order from logical text and directional properties, but its paragraph level/base direction is an input that a higher-level protocol may set.

YomPUB therefore needs a way to preserve authorial base direction when necessary. Likely semantic states are conceptually LTR, RTL, and possibly automatic inference, but the exact vocabulary should be decided only after examples are tested.

`auto`-style behavior is useful for unknown/user-supplied text, not a reason to omit authorial direction from known book prose. First-strong heuristics can be wrong for paragraphs that begin with a neutral, number, quote, or embedded foreign phrase.

### 4.3 Writing mode

Base direction and writing mode are also separate.

CSS Writing Modes distinguishes horizontal and multiple vertical/sideways block-flow modes. Japanese `vertical-rl` is not merely “RTL text rotated 90 degrees.” The line boxes progress right-to-left while characters have their own orientation rules and the inline text progression is vertical.

YomPUB probably needs only the authorial **principal writing mode** at first. Fine-grained local changes should be added only from real-book evidence.

### 4.4 Inline exceptions

Mixed bidi text establishes the strongest case for some inline semantic mechanism.

Unicode has directional formatting/isolate control characters, but UAX #9 itself recommends using suitable HTML/CSS mechanisms on the Web instead of raw formatting controls where possible. A source format can likewise provide readable semantic markup that a renderer maps to isolates/`dir`/`bdi`/CSS.

The minimum capability to investigate is:

- scoped language change;
- scoped direction/isolation for a fragment whose direction differs from surrounding prose or whose contents should not affect the surrounding bidi ordering;
- an explicit override only if real publishing cases require it, because overrides are stronger and easier to misuse than isolation.

This does not imply a large generic span-attribute system. Phase 1 should attempt the smallest notation that preserves these semantics.

## 5. Annotation / ruby study

### 5.1 Japanese ruby

Japanese ruby associates annotation text, commonly pronunciation, with base text. The important source semantic is the relationship between the base run and its annotation. Presentation details include placement above/beside text, distribution over multiple base characters, spacing, collision, and behavior in vertical writing.

Those presentation details belong primarily to the renderer.

A source format that stores only flattened visual text such as `漢字（かんじ）` cannot reliably distinguish pronunciation annotation from ordinary parenthetical prose. Preserving an explicit relation is therefore valuable even if unsupported plain-text readers degrade gracefully.

### 5.2 Chinese bopomofo / zhuyin

CSS Ruby treats bopomofo/zhuyin as a ruby use case but its visual behavior differs from common Japanese ruby. Bopomofo is often placed as inter-character annotation beside Han characters, and tone marks require special positioning. The CSS Ruby specification explicitly assigns glyph alignment/positioning to the user agent and font subsystem.

This is encouraging for a tiny semantic model: YomPUB may only need to say which annotation belongs to which base text. It should not encode “put this tone mark N pixels to the right.”

### 5.3 Other interlinear annotation

The term “interlinear annotation” covers much more than pronunciation ruby: linguistic glosses, translations, grammatical labels, multiple annotation tiers, and annotations spanning different base ranges. A fully general model needs alignment rules, multiple layers, scope, and reading/accessibility policy.

That is beyond a tiny Core unless ordinary books prove they need it.

### 5.4 Recommendation

A **single-level generic ruby relation** is realistic:

- one base text range;
- one annotation text range;
- no layout coordinates in source;
- renderer determines orientation, distribution, sizing, and collision behavior according to language/script/writing mode.

This can plausibly cover simple Japanese furigana and the underlying semantic relationship for bopomofo. It should not be advertised as a universal linguistic interlinear-annotation system.

Whether this relation belongs in Core or an extension is ultimately a product-scope choice. Given YomPUB's Japanese origin and stated international/vertical-writing goals, ruby is a strong Core candidate because omitting it would force ordinary Japanese publication semantics into raw HTML or ad-hoc punctuation.

## 6. Things YomPUB must not reinvent

### 6.1 Bidirectional reordering

Use the Unicode Bidirectional Algorithm. Store text in logical order. Do not reverse RTL strings. Do not attempt punctuation mirroring or run ordering in the parser.

### 6.2 Script shaping

Arabic contextual joining, Indic conjunct shaping, mark positioning, ligatures, variation behavior, and font-specific glyph selection belong to mature shaping/font systems. The parser's job is to preserve the Unicode sequence and semantic boundaries, not output presentation forms.

### 6.3 Grapheme segmentation

UAX #29 defines extended grapheme clusters and other default text boundaries. Text tools that select, truncate, count “characters,” apply decorations, or split runs must not assume one code point equals one user-perceived character.

Even grapheme clusters are not a universal answer for every editing/typographic operation; some scripts need higher-level orthographic/syllabic boundaries. The safe rule is to use the standard/platform operation appropriate to the task, never `string[i]` as typography.

### 6.4 Line breaking and hyphenation

UAX #14 produces line-break opportunities; the actual chosen wrap points belong to higher-level layout with width/font information. CSS Text further describes language/script-specific behavior, including lexical breaking for Thai/Lao/Khmer and orthographic syllable analysis for some Brahmic scripts.

YomPUB should not insert permanent line breaks to fit a page or implement a universal “break on spaces” rule.

### 6.5 Vertical glyph orientation

Unicode Vertical Orientation and CSS Writing Modes/Text Orientation encode years of script-specific work. YomPUB should carry writing intent and let the renderer decide whether glyphs remain upright, rotate, translate, or use vertical alternates.

### 6.6 Font fallback

A manuscript should not need to name a font to say what language/script its text is. Viewers should use fonts capable of rendering the Unicode content and respect platform/user accessibility preferences. Packaged fonts can be a later distribution feature if necessary.

### 6.7 Compatibility normalization as cleanup

Unicode normalization is useful, but **NFKC/NFKD must not be blindly applied to arbitrary prose**. Unicode explicitly warns that compatibility normalization erases distinctions and can remove semantically important formatting distinctions unless replaced by markup.

Even NFC changes the code-point sequence while preserving canonical meaning. YomPUB should decide whether it requires/recommends a canonical form only after considering round trips, diffs, search, and authoring tools. A safe initial parser principle is: preserve source text and treat canonically equivalent sequences appropriately where comparison requires it, rather than silently rewriting every save.

## 7. Reference test corpus proposal

The first corpus should be deliberately small enough to run in every parser/viewer test suite. Samples should be purpose-written or public-domain fragments and should record both the source semantics and expected invariants. The goal is to catch corruption and responsibility-boundary mistakes, not to certify perfect typography in every font/browser.

| Case | Purpose-written sample idea | What it catches |
|---|---|---|
| 1. English LTR | Short paragraph with punctuation, emphasis, link | Baseline structure and LTR |
| 2. Arabic RTL | Arabic sentence with Arabic-script punctuation and a number | Base RTL + shaping + number run |
| 3. Hebrew mixed bidi | Hebrew sentence containing `report-2026.pdf`, `https://example.org/a?b=2`, and `123` | Neutral punctuation, Latin runs, URL/filename behavior |
| 4. Bidi isolate case | RTL prose containing an unknown-direction book title/person name span | Whether inline isolation prevents surrounding reordering changes |
| 5. Japanese horizontal | Japanese paragraph without spaces and with Japanese punctuation | CJK line breaking, no-space assumption |
| 6. Japanese vertical | Vertical paragraph containing 、。「」 Latin acronym and digits | Writing mode, punctuation orientation, mixed-script orientation |
| 7. Short horizontal-in-vertical candidate | Date such as `12月` or a two-digit number in vertical prose | Whether an extension for local combination is needed |
| 8. Arabic joining controls | Purpose-written Arabic/Persian sequence using a legitimate ZWNJ/ZWJ case | Parser must preserve invisible joining controls |
| 9. Devanagari cluster | Short Hindi/Marathi sequence with conjunct/combining behavior | Code-point slicing and shaping bugs |
| 10. Combining equivalence pair | Same Latin word once precomposed and once base+combining mark | Canonical-equivalence/search/diff behavior without corruption |
| 11. Thai no-space text | Purpose-written Thai sentence | Lexical line breaking and correct language propagation |
| 12. Japanese ruby | Simple base + furigana, including multi-character base | Semantic annotation mapping and vertical/horizontal rendering |
| 13. Zhuyin/bopomofo ruby | Han character(s) with bopomofo + tone mark | Annotation relation must not assume Japanese-only layout |
| 14. Mixed-language accessibility | Japanese paragraph containing an English phrase and Arabic phrase with explicit language scopes | Inline language propagation, speech/accessibility semantics |

For each sample, tests should separately assert:

- **parse preservation:** Unicode sequence and semantic annotation survive parse/serialize;
- **normalized document:** language/direction/writing-mode scopes are unambiguous;
- **Web mapping:** generated HTML uses appropriate semantic language/direction/ruby constructs rather than visually reordered text;
- **visual smoke test:** browser/platform layout is plausibly correct at multiple viewport sizes;
- **accessibility smoke test:** language/alt/ruby structure is exposed semantically where platform APIs permit inspection.

Pixel-identical screenshots should not be the normative definition of script correctness because fonts and shaping engines legitimately differ.

## 8. Phase 1 recommendations

These are design recommendations, not standards facts.

### Recommendation A — make UTF-8/logical order normative early

Core should define Unicode text storage and prohibit visually reordered RTL source. Source preservation is foundational to every other international feature.

### Recommendation B — use BCP 47 and keep language distinct from direction

Do not create a language list and do not use language as the sole direction switch. Provide a document default language and investigate minimal scoped language overrides.

### Recommendation C — preserve a principal writing mode, not layout CSS

A small semantic choice corresponding to established horizontal/vertical modes is enough for the first draft. Avoid exposing arbitrary CSS properties as book metadata.

### Recommendation D — include a minimal bidi exception capability

Rely on UBA by default, but do not assume default UBA behavior eliminates the need for higher-level isolation/base-direction information. Test real RTL paragraphs containing URLs, filenames, numbers, Latin titles, and unknown-direction spans before finalizing syntax.

### Recommendation E — treat one simple ruby relation as the leading Core candidate

Model annotation semantics only. Map to HTML ruby/CSS in the Web renderer. Test Japanese and bopomofo before declaring the model generic.

### Recommendation F — define prohibited tool behavior as conformance requirements

A tiny format can gain international robustness by specifying what conforming tools must **not** do:

- no code-point/string reversal for RTL;
- no splitting inside grapheme clusters for generic truncation/decoration;
- no blind compatibility normalization;
- no punctuation substitution based on writing mode in stored source;
- no permanent line wrapping based on the converter's current viewport;
- no deletion of ZWJ/ZWNJ, bidi isolates/marks, variation selectors, or combining marks as “invisible junk”;
- no inferring authorial language solely from script when a declared language exists.

### Recommendation G — let renderer conformance carry the hard typography

A viewer claiming international Core support should state that it uses standards-compliant Unicode shaping/bidi/segmentation and supports the required writing modes. The Core syntax should not expand merely because a particular browser has a bug; renderer workarounds belong in the implementation layer.

### Concrete unresolved Phase 1 decisions

1. Is a default language required for every packaged YomPUB publication, merely strongly recommended, or derivable only in limited cases?
2. What is the smallest scoped language notation that remains readable in plain text?
3. Which base-direction states are allowed, and when is automatic inference acceptable?
4. Does Core need inline bidi isolation from version 0.1, or can a tightly defined Unicode-control policy cover initial cases without harming plain-text authoring?
5. Which principal writing modes are valid in Core 0.1: only horizontal plus the two vertical block progressions, or more?
6. Is local horizontal-in-vertical text common enough for Core, or an extension?
7. Is simple ruby Core? If yes, how are base-span boundaries and escapes represented without creating a general attribute language?
8. Does Core require NFC, recommend it, or preserve arbitrary canonically valid Unicode while processors compare canonically?
9. What transformations are validators allowed to repair automatically versus only warn about?
10. Which viewer behaviors are mandatory for claiming support for RTL, vertical text, and ruby, and which are quality-of-implementation issues?

## 9. Sources

Primary and standards-body sources first.

### Unicode

- Unicode Bidirectional Algorithm, UAX #9 (Unicode 17.0): https://www.unicode.org/reports/tr9/
- Unicode Normalization Forms, UAX #15 (Unicode 17.0): https://www.unicode.org/reports/tr15/
- Unicode Line Breaking Algorithm, UAX #14: https://www.unicode.org/reports/tr14/
- Unicode Text Segmentation, UAX #29 (Unicode 17.0): https://www.unicode.org/reports/tr29/
- Unicode Vertical Orientation, UAX #50: https://www.unicode.org/reports/tr50/
- Unicode Standard: https://www.unicode.org/versions/latest/

### W3C / WHATWG Web text standards

- HTML Living Standard: https://html.spec.whatwg.org/
- W3C Internationalization, structural markup and right-to-left text: https://www.w3.org/International/questions/qa-html-dir
- W3C Internationalization, inline markup and bidi: https://www.w3.org/International/articles/inline-bidi-markup/
- CSS Writing Modes Level 4: https://www.w3.org/TR/css-writing-modes-4/
- CSS Text Level 4: https://www.w3.org/TR/css-text-4/
- CSS Ruby Annotation Layout Module Level 1: https://www.w3.org/TR/css-ruby-1/
- W3C Arabic & Persian Layout Requirements: https://www.w3.org/TR/alreq/
- W3C Devanagari Layout Requirements: https://www.w3.org/International/ilreq/devanagari/
- W3C Language Enablement Index: https://www.w3.org/International/i18n-drafts/nav/languagedev

### Accessibility / language

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2 SC 3.1.2, Language of Parts: https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts
- EPUB Accessibility 1.1: https://www.w3.org/TR/epub-a11y-11/

### Language tags

- BCP 47 / RFC 5646: https://www.rfc-editor.org/rfc/rfc5646

### Source interpretation notes

- W3C language-layout documents describe requirements and gaps for specific writing systems; they are used here to disprove unsafe universal assumptions, not to turn YomPUB into a script-by-script layout engine.
- CSS modules describe rendering behavior. References to CSS are evidence for what an initial Web viewer can delegate, not proposals to expose CSS syntax in YomPUB source.
- Unicode algorithms often define defaults that higher-level protocols may tailor. YomPUB must preserve the higher-level semantic inputs without duplicating the algorithms.
