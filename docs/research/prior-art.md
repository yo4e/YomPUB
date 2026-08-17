# Prior art and existing lightweight publication formats

Status: **Phase 0 research / non-normative**

This document is research input for YomPUB Phase 1. It does not define YomPUB syntax.

Research snapshot: **2026-08-18**.

## 1. Executive summary

### Does YomPUB still have a reason to exist?

**Yes, but the gap is narrower than “Markdown for books.”** That problem is already well explored.

The closest prior art found is **Markua**. Markua is a current, formal, CommonMark-based language developed at Leanpub specifically for books and courses. Its simple novel case is deliberately ordinary Markdown; it removes raw HTML, adds book concepts and attributes, and can be processed into publication outputs. In other words, the core intuition behind YomPUB — human-writable plain text plus publication semantics — is proven prior art, not a novel category.

Other mature approaches cover adjacent territory:

- **Pandoc Markdown** is an extremely capable authoring/conversion ecosystem and can produce EPUB, but its dialect and metadata surface are intentionally broad and tool-oriented.
- **AsciiDoc/Asciidoctor** is human-readable, semantic, and multi-output, including EPUB3, but its language surface is substantially larger and is oriented heavily toward technical publishing.
- **mdBook** demonstrates a small Markdown book project with explicit reading order, assets, metadata, and Web output, but is a build system/project convention rather than an exchange format for general books.
- **reStructuredText/Sphinx** offers readable structured text and mature conversion, but again carries a documentation-oriented ecosystem and a larger extensibility model.
- **DocBook Publishers** shows the opposite end of the spectrum: rigorous semantic publishing markup with explicit schemas, but XML is not plausibly the hand-authoring experience YomPUB is pursuing.
- **EPUB** is the mature distribution/interchange target. It solves packaging, resource bounds, reading order, navigation, metadata, accessibility, and rendering interoperability, but direct authoring requires substantially more infrastructure than a one-manuscript source format.
- The **W3C Publication Manifest** distilled useful publication concepts such as resource bounds and reading order, while the broader Web Publications work was discontinued for lack of implementation commitment. This is a warning not to assume that a theoretically elegant Web publication container will acquire an ecosystem automatically.

The strongest reason for YomPUB to continue is therefore a **specific profile of constraints**, taken together:

1. a tiny source for ordinary reflowable books;
2. readable and writable by hand;
3. strict enough to exchange between independent implementations rather than being merely one tool's input dialect;
4. international text semantics treated as first-class from the beginning;
5. rendering, conversion, production settings, and broad document features kept outside the Core unless the book's meaning would otherwise be lost.

That fourth point matters. Markua 0.31.49 explicitly removes the old `{rtl}` / `{ltr}` directives and a general direction attribute on the theory that language is sufficient to determine direction. W3C internationalization guidance does not support that equivalence: language and text direction are separate dimensions, and a language may be written in scripts with different directions. This does **not** make Markua unsuitable as prior art, but it does mean direct adoption would require careful internationalization review rather than treating Markua as a drop-in answer.

**Non-binding recommendation:** do not invent a new prose grammar unless Phase 1 uncovers a requirement that cannot be expressed cleanly as a small profile of an existing grammar. A tightly defined CommonMark-derived profile remains a strong option, but Phase 1 should explicitly compare that option against profiling/adapting Markua rather than pretending Markua does not already occupy the same design space.

## 2. Candidate map

| Candidate | Status / maintainer | Source syntax | Human-writable? | Readable without tools? | Reflow? | Packaging / project complexity | Images / assets | Multilingual / RTL / vertical | Export / interoperability | Closest overlap with YomPUB |
|---|---|---|---|---|---|---|---|---|---|---|
| EPUB 3.3 | W3C Recommendation (2026) | XHTML/CSS + package XML in ZIP | Technically yes, ergonomically poor | Individual XHTML yes; package as a whole no | Yes | High relative to YomPUB: container, package, manifest, spine, nav, resources | First-class | Strong via HTML/CSS/Unicode and EPUB rules | Excellent distribution ecosystem | Requirements YomPUB must preserve when exporting |
| CommonMark 0.31.2 | CommonMark project | Markdown | Yes | Yes | Output-dependent | None by itself | Image links | Unicode text, but no publication-level language/direction/writing-mode model | Huge parser ecosystem | Candidate base grammar, not a book format |
| Markua 0.31.49 | Leanpub / Peter Armstrong | CommonMark-derived Markdown with book/course extensions | Yes | Yes | Processor-dependent | Manuscript-file list intentionally out of spec; rich document settings/extensions | Unified resource model | Language spans/settings; current direction model derives direction from language; no general `dir`; vertical-book model not demonstrated as a core strength | Leanpub processors; intended PDF/EPUB/HTML/other outputs | **Closest conceptual overlap** |
| Pandoc Markdown | Pandoc project | Extended Markdown + YAML metadata | Yes | Mostly | Yes in suitable outputs | Low for simple files, potentially high through options/templates/filters | Strong | Rich Unicode/HTML/EPUB pathways; behavior varies with writer/target | Excellent format conversion including EPUB | A toolchain that can consume a YomPUB-like source |
| AsciiDoc / Asciidoctor | Eclipse AsciiDoc effort / Asciidoctor project | AsciiDoc | Yes | Yes | Yes | Larger syntax and processor ecosystem | Strong | UTF-8; current official Asciidoctor HTML/PDF converters do not fully support RTL | HTML, PDF, EPUB3, DocBook, etc. | Human-writable semantic publishing with a broader feature set |
| mdBook 0.5.x | Rust project/community | CommonMark + extensions; `book.toml`; `SUMMARY.md` | Yes | Yes | HTML output yes | Small but multi-file and build-system oriented | Static files in source tree | Book language and explicit text direction supported; primarily Web/documentation oriented | Built-in HTML/Markdown plus third-party backends | Useful small-project anatomy: metadata + explicit order + files |
| reStructuredText / Docutils | Docutils project | reStructuredText | Yes | Yes | Output-dependent | Moderate; directives/roles are extensible | Supported through directives | Unicode through Python/Docutils; no tiny publication-specific i18n contract | Mature structured document conversion | Evidence that readable plain text can still have rigorous structure |
| Sphinx | Sphinx project | Usually reStructuredText or MyST via extensions + project config | Yes | Source yes | Yes | Tool/project configuration and extension system | Strong | Output/tool dependent | HTML, EPUB 3, LaTeX/PDF and others | Multi-file publishing toolchain, not an interchange syntax |
| DocBook Publishers 5.2.1 | DocBook Technical Committee | XML / RELAX NG + Schematron | Possible but verbose | Structurally readable, not pleasant prose authoring | Output-dependent | High semantic/schema surface | Strong | Mature XML/i18n ecosystem | Publishing semantics YomPUB can deliberately avoid encoding wholesale |
| W3C Publication Manifest | W3C Recommendation (2020) | JSON-LD manifest | Machine-oriented | No as manuscript | Resource-dependent | Manifest model rather than prose syntax | Resource list | Language/direction fields and reading progression; content rendering delegated | Standardized conceptual manifest | Useful model for bounds, reading order and derivation |
| Web Publications / Packaged Web Publications | W3C Working Group Notes; discontinued | Web resources + manifest concepts | Not primarily | Resource-dependent | Yes | Web publication architecture | Strong in principle | Web-platform dependent | Work discontinued | Historical warning about ecosystem/implementation assumptions |

The table compares roles, not feature counts. A larger feature surface is not automatically better for YomPUB.

## 3. Detailed notes

### 3.1 CommonMark: strong grammar substrate, insufficient publication model

CommonMark exists to make Markdown parsing interoperable. Version 0.31.2 has a detailed grammar and test corpus for paragraphs, headings, emphasis, links, images, lists, code, and other common constructs.

That is exactly the kind of work YomPUB should avoid repeating. Reusing a well-tested parser grammar gives independent implementations a realistic path to agreement.

However, CommonMark is not a publication format. It does not define publication identity, language metadata, reading direction, writing mode, resource bounds, a book-level reading order, packaging, accessibility metadata, or ruby. It also includes raw HTML blocks and raw HTML inlines. If YomPUB uses CommonMark as a base, it still needs an explicit profile: “whatever a Markdown parser accepts” would not be interoperable enough.

A useful lesson from Markua is that removing raw HTML is technically and conceptually viable. A portable manuscript should not need arbitrary HTML as an escape hatch for every missing semantic.

### 3.2 Markua: the closest prior art and the most important challenge

Markua is the candidate YomPUB must take most seriously. The current formal specification is version 0.31.49 dated 2026-06-30 and is explicitly based on CommonMark 0.31.2. It preserves the CommonMark grammar except for removing HTML blocks/raw HTML, adds selected GFM features, and adds many book/course extensions.

Its simple novel example is intentionally just ordinary Markdown headings, paragraphs, emphasis, and thematic breaks. That is extremely close to YomPUB's desired raw-text ergonomics.

Reusable ideas include:

- define the language as deltas from a known base specification;
- keep the simple-book case visually boring;
- remove raw HTML rather than allowing it to become an unofficial second syntax;
- model resources in a way that can target multiple outputs;
- support language changes at document, block, and span scope;
- keep the list of manuscript files outside the core language grammar, allowing different processors to package it differently.

But Markua is broader than YomPUB's proposed Core. Its specification includes courses, quizzes/exercises, attributes, layout-related options, indexes, crosslinks, document settings, and production-oriented features. Those may be valid for Markua's goals while still being outside YomPUB Core.

The largest internationalization concern is direction. The current specification says explicit LTR/RTL directives and a general direction attribute are unnecessary because language determines direction. It also requires unsupported/unrecognized language values to fall back to English and LTR. W3C guidance distinguishes language from direction, including languages such as Azerbaijani that can use scripts with different directions. For an international-first interchange format, YomPUB should not copy this assumption without a stronger model.

This makes **“YomPUB as a constrained Markua profile or adaptation”** a real Phase 1 option, but not an automatic decision.

### 3.3 Pandoc Markdown: excellent conversion substrate, intentionally not tiny

Pandoc demonstrates how far a Markdown-centered workflow can go. Its EPUB writer can derive or accept publication metadata, cover information, CSS, identifiers, language, and other EPUB-specific data. YAML metadata blocks can express rich nested objects and lists.

This is useful evidence that a small manuscript can feed a complex target. It is also evidence for keeping conversion complexity outside YomPUB Core: the authoring format does not need to mirror every EPUB package element.

Pandoc is not a good definition of YomPUB syntax by itself because “Pandoc Markdown + its full metadata/options/filter ecosystem” is a large, evolving authoring environment. YomPUB should instead aim to be something a Pandoc reader/writer could implement predictably.

### 3.4 AsciiDoc / Asciidoctor: semantic power at a higher complexity point

AsciiDoc is explicitly a human-readable lightweight semantic markup language and can produce HTML, PDF, EPUB3, DocBook, and other outputs. It proves that plain text can support serious publishing without becoming XML.

The tradeoff is surface area. The language has directives/attributes, rich structural features, technical-document features, and an implementation history that is still being converted into a ratified independent language specification. Asciidoctor's own documentation states that, until the first AsciiDoc Language Specification is ratified, the Asciidoctor implementation defines the language.

For YomPUB, the lesson is not “AsciiDoc is too complex” in the abstract. The lesson is to demand evidence before importing features that ordinary reflowable books do not need.

The current Asciidoctor localization documentation also reports incomplete RTL support in its official HTML/PDF converters. That is a reminder that “Unicode text accepted” and “international layout works” are separate claims.

### 3.5 mdBook: a useful minimal project anatomy

mdBook is a command-line system for books made of Markdown chapters. A typical project has `book.toml`, a `src` directory, and `src/SUMMARY.md`. The summary is mandatory for the book model and explicitly determines which chapters exist, their order, hierarchy, and paths.

This is valuable prior art for one YomPUB question: **reading order becomes explicit as soon as a publication is multi-file**. If YomPUB v1 remains a single `book.md`, source order already supplies the reading order and a separate spine-like file can be derived. If YomPUB later supports independently ordered multiple content files, it will need some equivalent source of order.

mdBook also separates book `language` from an optional explicit `text-direction`, even though it can derive direction when the latter is omitted. This is closer to W3C internationalization guidance than assuming language and direction are identical.

### 3.6 reStructuredText / Sphinx: extensibility is powerful but changes the contract

reStructuredText has a current formal markup specification and is designed to remain readable as plaintext while producing structured document trees. Its directives and interpreted roles make it highly extensible. Sphinx builds on structured source plus a project graph and can output EPUB 3 among many other formats.

The relevant lesson is architectural: once arbitrary directives/roles/extensions become part of normal source, the meaning of a document depends on an extension environment. That is excellent for a documentation toolchain but dangerous for a tiny interchange Core. YomPUB extensions, if added, need explicit versioning and unknown-extension behavior rather than an assumption that every processor loads the author's plugin stack.

### 3.7 DocBook Publishers: semantics without authoring minimalism

DocBook Publishers is a publishing-specific customization/subset of DocBook, with current 5.2.1 schemas expressed in RELAX NG and Schematron. It demonstrates that rigorous publication semantics and validation are achievable.

It also demonstrates why YomPUB exists as a source-layer experiment: XML element syntax and schema machinery are not the intended ordinary-author experience. YomPUB can still borrow semantic distinctions from mature publishing standards without borrowing their serialization.

### 3.8 W3C Publication Manifest and discontinued Web Publications work

The Publication Manifest Recommendation defines a machine-oriented JSON-LD model for a publication's metadata, default reading order, resource list, links, and bounds. Its conceptual separation is useful:

- descriptive metadata;
- ordered primary resources;
- additional publication resources;
- linked resources outside the publication bounds.

YomPUB does not need JSON-LD in its Core to learn from that model. For a one-file source, much of it can be derived from document order and local references. If packaging grows later, the same concepts may become explicit.

The broader Web Publications / Packaged Web Publications effort was discontinued because practical business cases and implementation commitment were insufficient. YomPUB should treat this as a governance/ecosystem lesson: a technically neat format is not useful merely because it is Web-shaped. A small reference implementation, converters, and real books matter more than theoretical completeness.

## 4. Reusable ideas

YomPUB should strongly consider borrowing these ideas rather than inventing equivalents:

1. **CommonMark's specified/tested parsing model** for ordinary prose constructs.
2. **Markua's “base spec plus explicit modifications” method**, especially removal of raw HTML and the boring simple-book case.
3. **EPUB / Publication Manifest's distinction between content order and resource inventory**.
4. **mdBook's lesson that multi-file books require an explicit ordering source**.
5. **Pandoc/Asciidoctor's converter boundary:** complex target metadata and packaging can be generated from a simpler semantic source.
6. **BCP 47 language tagging** rather than a YomPUB-specific language vocabulary.
7. **Explicit semantic direction separate from language** when it cannot be safely derived.
8. **Independent extension/version contracts** instead of tool-specific plugins silently defining document meaning.
9. **A conformance corpus from the beginning**, following CommonMark's example, so two implementations can be compared mechanically.

## 5. Complexity YomPUB can avoid

The following layers solve real problems but do not need to appear in a tiny Core source unless evidence changes:

- an EPUB-like XML package/manifest authored by hand;
- arbitrary raw HTML, JavaScript, or CSS in the manuscript;
- a generic JSON-LD graph;
- full YAML with nested objects, implicit typing, aliases, etc.;
- course/quiz/exercise semantics;
- technical-document admonition and code-testing systems;
- indexes, bibliographies, math, tables, media overlays, fixed layout, scripting, DRM, embedded fonts, and advanced production controls;
- publisher/distributor metadata that an exporter or external catalog can supply;
- arbitrary plugin directives whose interpretation is not part of a versioned extension contract.

Avoiding these is not a claim that they are bad features. It is a claim about YomPUB Core's narrower job.

## 6. Design options

### Option A — new independent syntax

**Advantages**

- total control over grammar;
- could be extremely small;
- no inherited raw-HTML or Markdown corner cases.

**Risks**

- reinvents solved parsing questions;
- every editor/parser/converter needs YomPUB-specific support;
- higher chance of ambiguity in apparently simple punctuation rules;
- harder to justify after CommonMark and Markua.

**Compatibility consequence:** lowest ecosystem leverage. This option now needs a positive requirement, not merely aesthetic preference.

### Option B — profile/subset of an existing publication language, especially Markua

**Advantages**

- Markua already models Markdown as books and has a formal current specification;
- publication semantics and implementation experience can be reused;
- less reinvention than a new format.

**Risks**

- Markua's scope is broader than YomPUB's intended Core;
- current internationalization assumptions, especially direction-from-language, conflict with requirements identified by YomPUB research;
- a “subset plus incompatible corrections” can become more confusing than a clearly named profile;
- implementation support outside Leanpub still has to be evaluated, not assumed.

**Compatibility consequence:** potentially strong conceptual compatibility, but only if the exact profile and divergences are explicit.

### Option C — tightly defined CommonMark profile + minimal publication semantics/package convention

**Advantages**

- widest parser ecosystem;
- source remains familiar and readable;
- YomPUB can define only the missing book semantics;
- easy to keep renderer/converter responsibilities outside Core;
- can borrow Markua ideas without inheriting its entire language.

**Risks**

- “profile” must be normative; otherwise parser differences leak in;
- excluding raw HTML needs explicit behavior;
- publication-specific inline semantics (ruby, language/direction exceptions) still need small extensions;
- packaging/order rules still need definition once a book becomes multi-file.

**Compatibility consequence:** strongest generic Markdown interoperability for the simple case, while YomPUB-specific semantics require processors that understand the profile.

## 7. Recommendation for Phase 1

**Non-binding design recommendation:** continue YomPUB, but narrow the claim.

YomPUB should not position itself as the invention of Markdown-for-books. Markua already occupies that space convincingly. Instead, Phase 1 should test whether YomPUB can define a **smaller, international-first exchange profile for ordinary reflowable books** whose source remains useful outside any one publishing service.

The leading design experiment should be:

> a tightly specified CommonMark-derived Core, with raw HTML excluded, plus only the minimum publication semantics that cannot be derived or delegated.

Before choosing it, Phase 1 should perform a direct syntax/semantics comparison against Markua for a small corpus of ordinary books. If a clean Markua profile with corrected international-text semantics can satisfy YomPUB's constraints better, adopting/profile-building is a valid outcome.

The prior-art research therefore does **not** prove that a new file format is necessary. It supports a more precise statement: there remains room for a tiny, implementation-neutral, international-first book-source **profile**, but YomPUB must earn every divergence from CommonMark and Markua.

### Concrete Phase 1 questions

1. Can YomPUB be specified as a pure profile of Markua, or would its internationalization and minimal-scope differences make that misleading?
2. If CommonMark is the base, exactly which constructs are included/excluded, and what happens to raw HTML in source?
3. What is the minimum semantic extension set after the writing-systems and EPUB research: language, base direction, writing mode, ruby, and what else?
4. Can v1 remain one ordered content document so that a separate source-level spine is unnecessary?
5. Which metadata must live in the manuscript, and which should be converter/catalog metadata?
6. What does “unknown extension” mean for validity and readable degradation?
7. Can a small conformance corpus prove that independent parsers produce the same normalized document model?
8. What concrete ordinary-book case does YomPUB support better or more simply than Markua? If that question has no strong answer after prototyping, YomPUB should consider becoming a profile rather than a new independent format.

## 8. Sources

Primary/maintainer sources were preferred.

- CommonMark 0.31.2 specification: https://spec.commonmark.org/0.31.2/
- Markua specification 0.31.49 (2026-06-30): https://markua.com/
- Pandoc User's Guide: https://pandoc.org/MANUAL.html
- AsciiDoc Language documentation: https://docs.asciidoctor.org/asciidoc/latest/
- Asciidoctor localization support: https://docs.asciidoctor.org/asciidoctor/latest/localization-support/
- Asciidoctor EPUB3 documentation: https://docs.asciidoctor.org/epub3-converter/latest/
- mdBook documentation: https://rust-lang.github.io/mdBook/
- mdBook `SUMMARY.md`: https://rust-lang.github.io/mdBook/format/summary.html
- mdBook general configuration: https://rust-lang.github.io/mdBook/format/configuration/general.html
- reStructuredText project/reference: https://docutils.sourceforge.io/rst.html
- reStructuredText Markup Specification: https://docutils.sourceforge.io/docs/ref/rst/restructuredtext.html
- Sphinx builders (including EPUB3): https://www.sphinx-doc.org/en/master/usage/builders/index.html
- DocBook Publishers schemas: https://docbook.org/schemas/publishers/
- W3C Publication Manifest Recommendation: https://www.w3.org/TR/pub-manifest/
- W3C Packaged Web Publications Note (discontinued work): https://www.w3.org/TR/pwpub/
- EPUB 3.3 Recommendation: https://www.w3.org/TR/epub-33/
- W3C Internationalization, structural markup and text direction: https://www.w3.org/International/questions/qa-html-dir

### Source notes

- Tool/project capabilities above are reported from their maintainers' current documentation as of the research snapshot; they are not guarantees about every third-party implementation.
- Markua's formal specification and Leanpub's currently deployed Markua behavior are not identical; the formal specification is used here because the research question concerns language design, and the Markua documentation itself warns about implementation differences.
- Web Publications is included as historical architecture evidence, not as a current recommended standard.
