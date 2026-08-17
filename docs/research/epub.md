# EPUB internals and lessons for a tiny reflowable format

Status: **Phase 0 research / non-normative**

This document is research input for YomPUB Phase 1. It does not define YomPUB syntax.

Research snapshot: **2026-08-18**.

Normative baseline studied: **EPUB 3.3, W3C Recommendation, 13 January 2026**, together with **EPUB Reading Systems 3.3, W3C Recommendation, 17 October 2024**, and **EPUB Accessibility 1.1, W3C Recommendation, 17 October 2024**. EPUB 3.4 and EPUB Accessibility 1.2 are Working Drafts in 2026 and are noted only where useful as future direction; they are not treated as the stable requirements baseline.

## 1. Executive summary

EPUB's complexity is not one thing. It is several layers that solve different problems:

- a single-file transport container;
- a package document that identifies the publication and its resources;
- an explicit default reading order;
- a navigation document for human and machine navigation;
- Web content documents and styles;
- resource/media-type rules and fallbacks;
- language and direction metadata;
- accessibility conformance/discoverability metadata;
- validation and reading-system behavior;
- security/privacy rules needed because EPUB can contain active and remote Web content.

A tiny YomPUB source does **not** need to make authors write equivalents of all those layers. But several underlying requirements cannot safely be discarded merely because the EPUB serialization is heavy.

The most important lessons are:

1. **Reading order is real.** EPUB's spine is required because a package may contain many resources whose filesystem or manifest order is not the book's reading order. YomPUB can derive this for a single `book.md`; if it later supports multiple independently ordered content files, it needs an unambiguous source of order.
2. **Navigation is not identical to reading order.** EPUB requires a navigation document and a table of contents because readers need a structured way to move through a publication. YomPUB can probably derive a first navigation tree from headings, but it should preserve enough structure to produce accessible navigation reliably.
3. **Resource bounds matter for distribution.** EPUB's manifest makes the publication's resources explicit. YomPUB can derive local assets from references for a simple source tree, but a packager/validator must be able to determine what belongs to the book and reject paths that escape it.
4. **Minimum exchange metadata is smaller than EPUB's full metadata vocabulary.** EPUB 3.3 requires title, identifier, language, and modification timestamp in the package. YomPUB source may not need to author all four: a converter/package step can generate some exchange metadata. Language is different because it affects content interpretation and accessibility and therefore belongs close to the source.
5. **International text mostly belongs to Web/Unicode rendering, but the source must preserve intent.** EPUB relies on HTML, CSS, Unicode, and resource-level language/direction semantics rather than inventing a typography engine.
6. **Accessibility must shape the source model early.** Unicode text alone is explicitly insufficient for all accessibility needs. Structure, language changes, text alternatives, navigation, directionality, and pronunciation/annotation semantics can affect assistive technology. Accessibility certification metadata itself can remain an export/distribution concern.
7. **Security complexity follows capabilities.** EPUB has a substantial threat model because it permits scripting, network access, remote resources, external links, and Web APIs. A YomPUB Core that excludes executable content and requires local packaged assets can avoid much of this attack surface. That is a substantive simplification, not merely fewer tags.
8. **Validation is part of interoperability.** A tiny syntax still needs clear invalid-document and unknown-field behavior. Simplicity without conformance rules merely moves complexity into incompatible implementations.

The architectural target suggested by EPUB is therefore not “mini-EPUB.” It is:

> keep the human source small, but retain enough semantic information that a converter can deterministically generate EPUB's required package, reading order, navigation, language/accessibility semantics, and resource inventory without guessing the author's intent.

## 2. EPUB minimal anatomy

A basic reflowable EPUB can be understood as five conceptual layers.

### 2.1 OCF container

The Open Container Format packages the publication as a ZIP-based single-file transport. It has defined files/locations used to locate the package document and imposes ZIP-related constraints. This layer primarily solves **distribution, portability, and deterministic package discovery**.

YomPUB source does not need to be a ZIP. A directory is easier to edit and version. A future `.yompub` package could use ZIP, but that is a distribution decision rather than a manuscript-language requirement.

### 2.2 Package document

The EPUB package document contains publication metadata and a **manifest** that exhaustively identifies publication resources used for rendering. Except for the package document itself, publication resources are listed in the manifest. Manifest order is not reading order.

This solves two distinct problems:

- what resources belong to this publication;
- descriptive/exchange metadata about the publication.

For a tiny source tree, YomPUB can derive much of the resource inventory by resolving local references from the manuscript. A converter still needs a deterministic publication root and path rules.

### 2.3 Spine / default reading order

The EPUB spine is required and provides the ordered list of content documents in the default reading order. Reading systems render spine content in that order.

This is why “just list the files in a manifest” is insufficient. Resource membership and reading order are different concepts.

For a single-file YomPUB Core, the source's own order is sufficient. The moment YomPUB permits multiple independently ordered primary content files, an explicit ordering mechanism or a deterministic convention becomes necessary.

### 2.4 Navigation document

EPUB requires an EPUB Navigation Document. It must contain exactly one table-of-contents `nav` element. This gives both users and software a structural navigation model. It is related to the spine, but not identical to it: the table of contents represents meaningful destinations and hierarchy, not merely the sequence of package resources.

YomPUB can likely derive an initial TOC from headings if heading semantics are constrained and clear. But “derive” still means the source must carry adequate section structure and the converter must define the derivation algorithm.

### 2.5 Content documents, CSS, and assets

Reflowable EPUB content is structured Web content, principally XHTML with CSS and other supported resources. This delegates text shaping, bidirectional layout, vertical writing, ruby rendering, links, images, and much presentation behavior to mature Web/Unicode technologies.

YomPUB can use the same separation at a different layer: Markdown-like source -> normalized semantic document -> HTML/CSS/EPUB rendering. The author does not need to write XHTML for the renderer to use XHTML.

## 3. Requirement-by-requirement analysis

The dispositions below are **YomPUB research recommendations**, not EPUB requirements.

| EPUB concept | Problem solved | EPUB 3.3 status | Relevance to YomPUB | Possible YomPUB treatment | Risk if omitted |
|---|---|---|---|---|---|
| OCF ZIP container | Single-file distribution and deterministic package discovery | Required for EPUB container | Medium | **Converter / future packaging** | Source can still work, but distribution becomes ad hoc if no package convention ever exists |
| Package document | Publication identity, metadata, resource graph, spine host | Required | High conceptually | **Derived / Converter** | EPUB export would require guessing/inventing package facts |
| Manifest | Complete publication resource inventory | Required | High for packaged books | **Derived for Core; packaging concern** | Missing assets, offline failures, path/security ambiguity |
| Spine | Default reading order | Required | High | **Derived for one-file Core; Core/packaging if multi-file** | Readers/converters can disagree on chapter order |
| `page-progression-direction` | Publication-level progression direction | Optional attribute with defined behavior | Medium/high for RTL books | **Core semantic if needed; exact field TBD** | UI/page progression may be wrong even if paragraphs render correctly |
| Navigation document / TOC | Human and machine navigation | Navigation document required; TOC nav required | High | **Derived from structure initially** | Poor navigation and accessibility; exporters must guess hierarchy |
| Package title | Identify publication | Required metadata | High | **Core/source metadata** | Unnamed exchange artifact; poor library/export behavior |
| Unique identifier | Stable publication identity | Required metadata | Medium | **Converter / packaging, optionally source** | Harder deduplication/catalog exchange; not necessary while drafting a loose manuscript |
| `dc:language` | Publication language metadata | Required; BCP 47 | Very high | **Core semantic** | Wrong shaping/hyphenation/pronunciation/default presentation; accessibility loss |
| `dcterms:modified` | Identify package revision | Required | Low in source | **Derived by exporter** | EPUB package would be invalid if not generated; no reason to hand-author it |
| Content-resource language | Correct interpretation of each document/span | Not inherited from package language; intrinsic format must carry it | Very high | **Core + inline semantic where language changes** | Screen readers, shaping, line breaking, pronunciation may be wrong |
| XHTML structure | Semantic content tree | Core content document format | High conceptually | **Normalized AST / renderer target, not author syntax** | Flat text loses headings, quotations, lists, links, alt text, etc. |
| CSS presentation | Layout/styling including writing modes | Web/CSS layer | High as renderer capability | **Viewer** | Putting CSS in source would couple manuscript to one rendering substrate; omitting renderer support breaks layout |
| Local images/assets | Illustrations and other resources | Supported core resources | High | **Core references + derived inventory** | Ordinary illustrated books fail |
| Media types/fallbacks | Handle supported/unsupported resource types | Defined by EPUB | Medium | **Keep Core asset types narrow; Converter handles EPUB mapping** | Broad arbitrary assets create compatibility/fallback complexity |
| Relative URLs/resource resolution | Portable linking | Defined processing model | High | **Core path rules** | Books break when moved; traversal may escape publication root |
| Ruby | Pronunciation/interlinear annotation | Expressible through HTML ruby/CSS | High for relevant languages | **Likely Core semantic; renderer handles layout** | Japanese/Chinese publication intent may be lost or encoded as hacks |
| Bidi / direction | Correct mixed-direction text and progression | Delegated substantially to HTML/CSS/Unicode with EPUB hooks | Very high | **Core semantic + Viewer/Unicode behavior** | RTL/mixed books can become unreadable or misleading |
| Vertical writing | Vertical flow/orientation | CSS/HTML/EPUB rendering support | High for Japanese and some other traditions | **Core writing intent; Viewer handles typography** | Cannot preserve intended reading/layout mode |
| Accessibility structure | Navigability/semantics for assistive tech | EPUB Accessibility builds on WCAG and EPUB structure | Very high | **Core semantics + Viewer** | Accessibility cannot reliably be bolted on after flattening meaning |
| Accessibility discoverability/certification metadata | Tell consumers what accessible features/conformance exist | Required for EPUB Accessibility conformance | Low for manuscript Core | **Converter/catalog/tool** | Export cannot claim discoverability/conformance unless assessed and emitted |
| Scripting | Interactive content | Supported with constraints | Low for ordinary YomPUB Core | **Exclude** | Including it imports major security/runtime complexity |
| Remote resources/network access | Dynamic/external content | Allowed with reading-system constraints | Low for portable Core | **Exclude or extension** | Tracking, offline breakage, origin/CORS/security complexity |
| External links | Link beyond publication | Supported with security guidance | Medium | **Core links; Viewer safety policy** | Forbidding ordinary references is unnecessary; blindly opening them can be unsafe |
| Encryption/DRM/signatures | Distribution control/integrity use cases | EPUB ecosystem facilities | Outside proposed Core | **Exclude / external distribution** | Some commercial workflows need separate packaging systems; Core stays simple |
| Conformance/validation | Interoperable producer/reader behavior | Normative specification + test/validation ecosystem | Very high | **Core spec + validator** | “Simple” documents produce divergent interpretations |
| Unknown/foreign resource behavior | Forward compatibility and unsupported content | Defined in EPUB | High conceptually | **Core/extension conformance rule** | Readers fail unpredictably on future fields/extensions |
| Security/privacy model | Protect user/device from publication capabilities | Detailed reading-system requirements | High architecturally | **Minimize capabilities; Viewer policy** | If active/network features creep in, a threat model becomes mandatory |

## 4. International text lessons

### 4.1 Language is semantic, not decorative

EPUB requires publication language metadata, but EPUB Reading Systems explicitly does **not** treat package-level `dc:language` as the language of each content resource. Content documents carry language through their intrinsic format (for XHTML, HTML language mechanisms).

The lesson for YomPUB is that a book-level language value is useful but insufficient for genuinely mixed-language books. A normalized YomPUB document needs a way to preserve language changes where they matter. This affects pronunciation, fonts, line breaking, hyphenation, and accessibility.

BCP 47 should be reused rather than inventing a YomPUB language-code list.

### 4.2 Base direction, bidi, and publication progression are different layers

Three ideas must not be collapsed:

1. inline/paragraph Unicode bidi behavior;
2. a content block/document's base text direction;
3. publication-level progression between resources/pages.

EPUB and the Web stack keep these separable. A Hebrew or Arabic content document still contains LTR numbers, URLs, filenames, and quoted Latin text; the Unicode Bidirectional Algorithm handles much of this, while HTML/CSS provide higher-level direction/isolation controls. Separately, EPUB can declare page progression for the publication.

YomPUB should preserve the semantic inputs and delegate reordering to standards-compliant renderers. It should not define a custom bidi algorithm.

### 4.3 Vertical writing is renderer work after intent is preserved

EPUB benefits from CSS Writing Modes rather than putting detailed glyph rotation instructions in the package grammar. YomPUB should follow the same boundary: preserve intended writing mode where it is authorial meaning; let the renderer apply Unicode Vertical Orientation, CSS writing modes/text orientation, fonts, and layout behavior.

Tate-chu-yoko-like local exceptions may eventually need a semantic extension if real books require them, but should not be generalized into a layout language prematurely.

### 4.4 Ruby is a semantic relationship first

EPUB can represent ruby using HTML ruby semantics and CSS rendering. This suggests YomPUB's source problem is not “how many pixels above the base text?” but “what annotation belongs to what base text?” A converter/viewer can map that relationship to HTML ruby and target-specific presentation.

### 4.5 Asset and font choices should not become language semantics

EPUB can package fonts and CSS, but a language tag is not a font selection. YomPUB Core can preserve language/script intent and let viewers use platform fallback. Embedded fonts, publisher typography, and target-specific CSS are better treated as packaging/viewer concerns unless future use cases prove otherwise.

## 5. Accessibility lessons

EPUB Accessibility 1.1 explicitly notes that Unicode text is important but not sufficient: directionality, emphasis, pronunciation, and other language/culture-specific information may also be necessary for accessible content.

The earliest YomPUB architecture should therefore preserve:

- heading/section structure in logical order;
- meaningful link text and targets;
- image text alternatives, including a way to represent decorative images;
- document language and language changes within content;
- direction semantics required to interpret text correctly;
- ruby/pronunciation relationships when authored;
- a deterministic reading order;
- enough hierarchy to derive an accessible table of contents;
- plain text in logical Unicode order rather than visually reordered glyph strings.

What YomPUB does **not** need in Core is the full distribution metadata used to certify or advertise accessibility. EPUB Accessibility's conformance statements, evaluator information, and discoverability metadata are publication assessment/distribution facts. An EPUB exporter or publishing tool can add them after an actual accessibility evaluation.

This distinction is important: **source semantics must make accessibility possible; certification metadata does not have to burden hand-authored manuscripts.**

WCAG 2.2's language requirements reinforce the need for programmatically determinable default language and language of parts where passages change language. A YomPUB model that can only declare one language for the whole book would make some accessible exports impossible without post-hoc guesswork.

## 6. What YomPUB can intentionally leave out

For the proposed ordinary reflowable Core, YomPUB can leave the following out of the source language while retaining a credible EPUB export path:

### Container machinery

Authors should not need to write `META-INF/container.xml`, package XML, manifest entries, MIME declarations, or ZIP ordering rules. A packager can generate them.

### Explicit manifest for the simple case

If the Core is one manuscript plus local assets referenced by path, a validator/packager can discover the resource set. This remains safe only if reference/path rules are strict and deterministic.

### Explicit spine for a single source document

One document already has a total source order. An exporter can split it into multiple XHTML resources and generate the corresponding EPUB spine. If YomPUB later permits arbitrary multi-file ordering, this simplification must be revisited.

### Separate hand-authored navigation document

A constrained heading model can generate an initial TOC. If real books need nav labels/order that differ from heading text/structure, Phase 1 or later versions may need explicit navigation metadata.

### Most bibliographic metadata

Publisher, rights, subjects, contributors, series information, edition statements, ISBNs, and catalog metadata are useful but need not all live in Core. Exporters/catalog systems can enrich publications. Title, language, and authorial semantics should remain easy to express.

### CSS and arbitrary presentation

Core should not be a style sheet. Reader themes and target-specific CSS can choose fonts, margins, line length, colors, and most spacing.

### Scripting and arbitrary active content

Excluding JavaScript and embedded applications eliminates a large portion of EPUB's security/privacy problem: origin isolation, script trust, network APIs, cross-document attacks, and many tracking vectors.

### Remote required assets

Portable books should prefer local assets. External hyperlinks are ordinary content; required remote images/scripts/fonts are a different dependency and should remain outside Core or require an explicit future extension.

### Fixed layout, media overlays, DRM, encryption, signatures

These are valid publication/distribution features but do not define an ordinary reflowable manuscript.

## 7. Must-not-forget list for Phase 1

- [ ] **Specify reading order.** If v1 is one source file, say explicitly that source order is the default reading order.
- [ ] **Specify section/navigation derivation.** Define how headings become a normalized hierarchy and TOC candidates.
- [ ] **Define a publication root and local-path rules.** Relative assets must not escape the root.
- [ ] **Define what resources belong to a packaged publication.** Derived is fine; ambiguous is not.
- [ ] **Keep language as semantic source data using BCP 47.**
- [ ] **Support language changes inside content if the Core promises accessible multilingual books.**
- [ ] **Keep base direction separate from language.**
- [ ] **Separate text direction from publication progression/writing mode where the concepts differ.**
- [ ] **Preserve vertical-writing intent without encoding CSS tricks.**
- [ ] **Preserve ruby/annotation relationships semantically if ruby is Core.**
- [ ] **Require useful image alternative text semantics and distinguish decorative images.**
- [ ] **Define invalid syntax, unknown metadata, and unknown extensions.**
- [ ] **Do not allow raw HTML/JS to become an interoperability escape hatch by accident.**
- [ ] **Keep EPUB-only timestamps/package identifiers derivable unless an authorial use case requires them in source.**
- [ ] **Build a converter test fixture early:** a tiny YomPUB book should deterministically yield a valid EPUB package with metadata, manifest, spine, nav, content docs, and assets.
- [ ] **Add security rules before adding capabilities.** Local passive content is a much smaller threat surface than remote/scripted content.

### Concrete Phase 1 questions

1. Is Core 0.1 explicitly single-file for primary content? If yes, this avoids an authored spine and simplifies navigation/resource rules substantially.
2. Are headings sufficient to derive the first normative navigation tree, including unnumbered front/back matter?
3. Which exchange metadata must be authorial source data versus generated package data? In particular: title, author, language, identifier, modification time.
4. Does YomPUB need publication-level reading progression distinct from text base direction and writing mode in Core 0.1?
5. What inline language and direction semantics are necessary for accessible mixed-language/bidi content?
6. Is one simple ruby relationship sufficient for Core while advanced annotation stays an extension?
7. What asset media types are allowed in Core 0.1, and what happens to an unsupported type?
8. How are missing assets, duplicate paths, external URLs, and traversal outside the publication root treated?
9. What exact normalized AST information must an EPUB exporter receive so that no authorial intent is guessed?
10. What minimal automated test proves the export boundary: source -> normalized document -> valid EPUB?

## 8. Sources

Primary standards first.

### Stable EPUB baseline

- EPUB 3.3, W3C Recommendation (13 January 2026): https://www.w3.org/TR/epub-33/
- EPUB Reading Systems 3.3, W3C Recommendation (17 October 2024): https://www.w3.org/TR/epub-rs-33/
- EPUB Accessibility 1.1, W3C Recommendation (17 October 2024): https://www.w3.org/TR/epub-a11y-11/

### Upstream standards used by EPUB / relevant to YomPUB

- HTML Living Standard: https://html.spec.whatwg.org/
- CSS Writing Modes Level 4: https://www.w3.org/TR/css-writing-modes-4/
- CSS Text Level 4: https://www.w3.org/TR/css-text-4/
- CSS Ruby Annotation Layout Module Level 1: https://www.w3.org/TR/css-ruby-1/
- Unicode Bidirectional Algorithm (UAX #9): https://www.unicode.org/reports/tr9/
- Unicode Line Breaking Algorithm (UAX #14): https://www.unicode.org/reports/tr14/
- Unicode Text Segmentation (UAX #29): https://www.unicode.org/reports/tr29/
- BCP 47 / RFC 5646 language tags: https://www.rfc-editor.org/rfc/rfc5646
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

### Related publication architecture

- W3C Publication Manifest Recommendation: https://www.w3.org/TR/pub-manifest/

### 2026 work in progress, not used as normative baseline

- EPUB 3.4 Working Draft series: https://www.w3.org/TR/epub-34/
- EPUB Accessibility 1.2 Working Draft: https://www.w3.org/TR/epub-a11y-12/

### Notes on version choice

EPUB 3.3 is the current W3C Recommendation as of the research snapshot. EPUB 3.4 is active work but is still a Working Draft, so YomPUB should watch it for simplification lessons without treating draft changes as settled interoperability requirements.
