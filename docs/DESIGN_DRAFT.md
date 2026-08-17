# YomPUB — Initial Design Draft

Status: **Pre-spec / Experimental**

This document records the first design direction for YomPUB. It is intentionally incomplete. The goal at this stage is to protect the project's simplicity before implementation pressure starts adding features.

## 1. One-sentence definition

> **YomPUB is a tiny, open, human-writable source format for reflowable digital books.**

A person should be able to create a valid simple book with a text editor and an image folder.

## 2. Why YomPUB exists

EPUB is a mature, powerful distribution format. EPUB 3.3 packages structured Web content such as XHTML, CSS, SVG, metadata, navigation, a manifest, reading order, and other resources into a defined container.

That power is useful, but direct EPUB authoring is more infrastructure than many ordinary books need.

YomPUB asks a narrower question:

> What is the smallest open format that lets a person write, illustrate, distribute, and read an ordinary reflowable book without learning a publishing container format?

The intended use cases include:

- novels and short stories
- essays and nonfiction
- simple illustrated books
- independent publishing
- books embedded in ordinary websites
- books placed as lightweight objects inside future Web or virtual spaces
- a clean source format that can later be converted to EPUB, PDF, or other outputs

## 3. Design laws

These are more important than any particular syntax choice.

### 3.1 Human-writable first

A YomPUB book must be writable without a dedicated authoring application.

### 3.2 The Core stays small

A feature does not enter Core because it is useful somewhere. It enters Core only if ordinary reflowable books repeatedly need it.

### 3.3 Source is not layout

Authors describe content and reading intent. Viewers control most presentation.

### 3.4 Internationalization is not an extension

LTR, RTL, bidirectional text, and vertical writing must be considered from the beginning.

### 3.5 Existing standards do the hard work

YomPUB should reuse Unicode text behavior, established language tags, browser writing modes, image formats, ZIP where useful, and existing parsing technology instead of inventing replacements.

### 3.6 Conversion is outside the format

DOCX import, EPUB export, PDF export, GUI editing, validation, and hosting are companion tools. They must not make the base format more complicated.

### 3.7 Plain source must remain useful

If every YomPUB-specific tool disappeared, the manuscript should still be understandable to a human.

### 3.8 Preserve intent; delegate typesetting

YomPUB Core should preserve the author's semantic and reading intent, but it should not become a text-layout engine.

For vertical writing, bidirectional text, shaping, line breaking, punctuation behavior, and similar typography, early YomPUB renderers should rely on mature standards and platform capabilities such as Unicode, HTML, CSS Writing Modes, browser layout engines, fonts, and operating-system text services wherever practical.

This delegation is an implementation choice, not a permanent dependency of the file format. A future YomPUB renderer may replace or supplement browser/CSS layout if there is a real need, without requiring existing YomPUB books or the Core data model to change.

The guiding boundary is:

> **YomPUB stores enough meaning to render the book correctly; the renderer decides how to perform the layout.**

## 4. Is Markdown the right base?

Markdown is the current leading candidate, not a sacred decision.

### Candidate A — custom plain-text markup

**Pros**

- complete control
- potentially tiny grammar

**Cons**

- immediately reinvents headings, emphasis, links, images, lists, quotations, escaping, and parsers
- every editor and conversion tool needs YomPUB-specific support

**Verdict:** too much reinvention.

### Candidate B — HTML

**Pros**

- excellent Web rendering support
- mature semantics for ruby, bidi, accessibility, links, and media

**Cons**

- verbose for prose
- unpleasant to hand-author at book length
- encourages layout and Web-application concerns to leak into manuscripts

**Verdict:** excellent rendering target; poor authoring format.

### Candidate C — XML or JSON

**Pros**

- strict and machine-friendly

**Cons**

- visually noisy
- prose becomes data structure rather than manuscript

**Verdict:** wrong ergonomics.

### Candidate D — richer lightweight markup such as AsciiDoc

**Pros**

- many publication features already exist

**Cons**

- larger syntax surface
- less familiar to casual authors
- encourages YomPUB to inherit features outside its minimal goal

**Verdict:** useful reference, probably heavier than necessary.

### Candidate E — CommonMark-based Markdown profile

**Pros**

- readable as plain text
- easy to type
- mature parsers in many languages
- already handles paragraphs, headings, emphasis, links, images, quotations, lists, and code
- works naturally with Git and text editors

**Cons**

- no standard ruby syntax
- no publication metadata
- no writing-mode metadata
- raw HTML is part of CommonMark
- footnotes are not in CommonMark Core

**Current direction:** use a **small, explicitly defined CommonMark-based profile**.

YomPUB should not mean “whatever Markdown a random parser accepts.” Interoperability requires a defined subset plus a very small number of YomPUB extensions.

## 5. Smallest possible book

The source form should start here:

```text
book.md
```

Example:

```md
---
title: The Smallest Book
author: A. Writer
lang: en
---

# Chapter One

It begins here.
```

With images:

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── map.png
```

```md
![Map of the island](assets/map.png)
```

No manifest should be necessary for this basic case. A renderer can discover locally referenced assets directly from the manuscript.

## 6. Metadata: deliberately not full YAML

The familiar front-matter shape is convenient:

```text
---
title: Moon Inn
author: A. Writer
lang: en
writing-mode: horizontal-tb
direction: ltr
cover: assets/cover.jpg
---
```

But YomPUB should avoid saying “this is arbitrary YAML.” Full YAML brings far more syntax and implicit typing behavior than a tiny book format needs.

The preferred direction is a **YomPUB Header** that merely resembles simple YAML:

```text
key: value
```

Initial rules should be intentionally restrictive:

- one field per line
- UTF-8 text
- no nesting
- no arbitrary objects
- no implicit booleans, dates, or numeric typing
- unknown fields may be ignored with a warning
- future repeated fields or lists must be added only when a real use case requires them

### Proposed initial fields

`title`
: Book title. Required for a packaged publication; optional while editing a loose manuscript.

`author`
: Human-readable creator name. Optional.

`lang`
: BCP 47 language tag. Strongly recommended.

`writing-mode`
: `horizontal-tb`, `vertical-rl`, `vertical-lr`, or `auto`.

`direction`
: `ltr`, `rtl`, or `auto`.

`cover`
: Relative path to a local cover image.

Do not add publisher, ISBN, series, edition, rights, subjects, contributor graphs, or other bibliographic metadata until concrete interoperability needs justify them.

## 7. Proposed YomMarkdown Core

Working name only. This does not need to become a separate project.

### Inherited from CommonMark

Initial candidates:

- paragraphs
- ATX headings (`#`)
- emphasis and strong emphasis
- links
- images
- block quotes
- ordered and unordered lists
- thematic breaks
- inline code and fenced code blocks
- soft and hard line breaks

### Deliberately excluded from Core

- raw HTML
- JavaScript
- arbitrary CSS
- embedded applications
- parser-specific Markdown extensions

Raw HTML is especially tempting because it can solve missing typography features instantly. Core should resist that shortcut: once arbitrary HTML becomes normal authoring syntax, YomPUB stops being a small portable manuscript format.

## 8. Ruby

Standard CommonMark has no ruby notation, so YomPUB needs a tiny extension if Japanese and other ruby-using typography are first-class use cases.

Leading proposal:

```text
｜人工知能《じんこうちのう》
```

Rendered meaning:

```text
base: 人工知能
ruby: じんこうちのう
```

Why this direction is attractive:

- readable in raw text
- familiar to Japanese plain-text publishing culture
- easy to parse
- no embedded HTML
- degrades gracefully in unsupported viewers

The exact grammar remains undecided. Open questions include punctuation boundaries, escapes, nested emphasis, and whether an ASCII-friendly equivalent is desirable for international tooling.

## 9. Images

Use ordinary Markdown image syntax:

```md
![Alternative text](assets/figure-01.png)
```

Core rules for portable books should remain simple:

- paths are relative
- packaged assets are local
- path traversal outside the publication root is invalid
- alt text is strongly encouraged
- an empty alt string means decorative content

Do not add floats, arbitrary positioning, or complex responsive image syntax to Core initially.

Captions are a real publishing need, but the simplest interoperable syntax should be tested before specification.

## 10. International text and writing direction

YomPUB source text is UTF-8 and stored in logical character order.

### Horizontal LTR

```text
lang: en
writing-mode: horizontal-tb
direction: ltr
```

### Horizontal RTL

```text
lang: ar
writing-mode: horizontal-tb
direction: rtl
```

RTL and mixed-direction text should follow the Unicode Bidirectional Algorithm rather than a YomPUB-specific bidi system.

### Vertical writing

```text
lang: ja
writing-mode: vertical-rl
direction: ltr
```

A Web renderer can map author intent to the platform's writing-mode capabilities. The initial reference viewer is expected to use HTML/CSS and browser layout for vertical composition rather than implementing Japanese typesetting from scratch.

YomPUB should therefore record only the information that must survive across renderers. It should not encode browser-specific layout tricks or CSS declarations into the book source. If browser/CSS support is insufficient for a future requirement, the renderer may add corrective logic or eventually use another layout engine while consuming the same YomPUB data.

Possible future typography extensions include:

- tate-chu-yoko
- emphasis marks / bouten
- script-specific annotation behavior

These should not be generalized prematurely.

## 11. Source form vs distribution form

Keep these concepts separate.

### Source form

A normal directory:

```text
book.md
assets/
```

This is the form humans edit and Git tracks.

### Distribution form

A future `.yompub` file may simply be a ZIP archive containing the source tree.

Example:

```text
novel.yompub
└── book.md
└── assets/
```

This is intentionally not required for early prototypes. A directory is enough to design and test the actual book model first.

## 12. Viewer architecture

The reference Web Viewer should remain conceptually simple:

```text
book.md
   ↓
YomPUB parser
   ↓
normalized document AST
   ↓
Web renderer
   ↓
HTML DOM + CSS writing modes
```

Important consequences:

- HTML may be an internal rendering target without becoming the authoring format.
- CSS and browser layout are the initial rendering substrate, not part of the YomPUB data model.
- a future non-browser or custom typesetting renderer should be able to consume the same normalized document without changing the book format.
- one parser/AST can later feed EPUB, PDF, search indexing, accessibility tools, or virtual-space renderers.
- author-controlled executable content is unnecessary for ordinary books and should stay out of Core.

### Initial Web Viewer goals

- mobile-first responsive reading
- horizontal LTR
- horizontal RTL
- Japanese vertical writing
- font-size control
- sensible line length / margins
- light and dark reading themes
- image display
- ruby
- browser-only loading of a local source directory or packed file where feasible

The first viewer should not become a library manager, store, social reader, annotation platform, or publishing CMS.

## 13. Conversion architecture

Converters surround YomPUB; they do not redefine it.

```text
DOCX ───────┐
Plain text ─┼──> YomPUB ──> Web
Other MD ───┘       ├─────> EPUB
                    └─────> PDF
```

A DOCX converter can make smart guesses about headings, images, emphasis, and metadata. Those heuristics belong to the converter, not the YomPUB specification.

Likewise, EPUB export may generate all XHTML, CSS, navigation, manifest, spine, and container files required by EPUB. YomPUB authors should not have to know those structures exist.

## 14. Candidate Core vs extensions

### Core candidates

- UTF-8
- YomPUB Header
- CommonMark profile
- relative images
- language
- writing mode
- base direction
- ruby

### Likely extension/tool territory

- footnotes
- captions / figures
- tables
- math
- bibliographies
- audio/video
- fixed layout
- arbitrary styling
- embedded fonts
- scripting
- DRM
- interactive widgets
- advanced metadata

This list is deliberately conservative. Some items, especially footnotes and captions, may prove common enough to move into Core after real books are tested.

## 15. A useful test for every feature

Before adding syntax, ask:

1. Can an ordinary novel or nonfiction book exist without it?
2. Can an existing standard or renderer handle it instead?
3. Can it be implemented as a converter or extension?
4. Does adding it make a hand-written YomPUB file harder to understand?
5. Would two independent implementations interpret it the same way?

If the feature fails this test, keep it out of Core.

## 16. Suggested first prototype

Do not start by writing a full specification.

Build the smallest vertical slice:

1. one `book.md`
2. tiny metadata header
3. headings, paragraphs, emphasis, and images
4. ruby
5. `horizontal-tb`, `vertical-rl`, and RTL support
6. mobile-friendly Web Viewer

Then feed it real books.

The specification should be extracted from what survives real use, not from every feature we can imagine in advance.

## 17. Open questions

- Is CommonMark still smaller in practice than defining a custom prose grammar?
- Which CommonMark features should YomPUB explicitly exclude?
- Is the front-matter delimiter `---` worth its potential ambiguity with Markdown thematic breaks?
- Should metadata live in `book.md`, or may an optional `book.meta` exist later?
- What is the smallest robust ruby grammar?
- Should ruby have an ASCII-only alternate notation?
- Are footnotes common enough for Core?
- What is the simplest caption syntax?
- Does a multi-file book need to exist in Core, or can v1 require one `book.md`?
- When should `.yompub` packaging become normative?
- What accessibility requirements belong in the base specification versus the reference viewer?
- Which vertical-writing intentions must survive in YomPUB data because a renderer cannot safely infer them?
- Where are CSS/browser writing-mode capabilities insufficient enough to justify renderer-side correction, without leaking layout implementation details into Core?

## 18. References informing the draft

These are upstream standards YomPUB should reuse rather than replace:

- CommonMark Specification: https://spec.commonmark.org/
- Unicode Bidirectional Algorithm (UAX #9): https://www.unicode.org/reports/tr9/
- CSS Writing Modes Level 4: https://www.w3.org/TR/css-writing-modes-4/
- EPUB 3.3: https://www.w3.org/TR/epub-33/

YomPUB is not intended to compete with these standards at their own jobs. Its purpose is to make the *authoring source for an ordinary digital book* dramatically smaller and easier to handle.
