# YomPUB

**A tiny, open, human-writable format for reflowable digital books.**

YomPUB is an experimental open format for digital books that aims to be simple enough to write by hand in a text editor, easy to render on the web, and portable enough to export to formats such as EPUB and PDF.

The name **YomPUB** comes from Japanese *yomu* (読む, “to read”). By a happy coincidence, *yom* also means “day” in Hebrew: the project likes the idea that a book should be publishable in a day, not after wrestling with a publishing container.

## The idea

A minimal YomPUB book should look almost boring:

```text
my-book/
├── book.md
└── assets/
    ├── cover.jpg
    └── figure-01.png
```

And `book.md` should remain readable even without a YomPUB tool:

```md
---
title: 月面旅館
author: 山田佳江
lang: ja
writing-mode: vertical-rl
cover: assets/cover.jpg
---

# 第一章　月面旅館

月面に旅館ができたのは、夏の終わりだった。

![月面旅館の外観](assets/figure-01.png)

これは｜人工知能《じんこうちのう》についての話でもある。
```

That is the core philosophy: **the source should already look like a book manuscript, not like a web application package.**

## Design principles

1. **Human-writable first.** A book can be created with a plain text editor.
2. **Small core.** Features do not enter the base format merely because they are possible.
3. **Reflow first.** YomPUB describes content and reading intent, not fixed pages.
4. **International by design.** Horizontal LTR, horizontal RTL, and vertical writing are first-class requirements.
5. **Reader-controlled presentation.** Fonts, themes, margins, and most visual styling belong to the viewer, not the book.
6. **No HTML required from authors.** The web may be a renderer, but HTML is not the authoring model.
7. **Portable and inspectable.** A YomPUB source should be understandable without proprietary software.
8. **Converters are tools, not the format.** DOCX import, EPUB/PDF export, and other conversions should live outside the core specification.

## Current direction

The leading proposal is:

- UTF-8 text
- a conservative **CommonMark-based** Markdown profile
- minimal YAML front matter for publication metadata
- standard Markdown image syntax
- a very small set of publication-oriented extensions, beginning with ruby text
- no raw HTML in the Core profile
- no JavaScript or executable content in the Core profile
- local relative assets for portable books
- an optional `.yompub` distribution file that is simply a ZIP container with `book.md` at its root

Markdown is not sacred. It is currently the best candidate because it is readable as plain text, easy to type, widely supported, and already solves headings, emphasis, links, lists, quotations, code, and images without inventing another markup language. The project will keep evaluating whether any even simpler representation can satisfy the same goals.

## Writing directions

A YomPUB renderer should support at least:

```yaml
# English and many other languages
lang: en
writing-mode: horizontal-tb
direction: ltr
```

```yaml
# Arabic, Hebrew, Persian, etc.
lang: ar
writing-mode: horizontal-tb
direction: rtl
```

```yaml
# Japanese vertical writing
lang: ja
writing-mode: vertical-rl
direction: ltr
```

Renderers should rely on Unicode bidirectional behavior and platform/browser writing-mode support rather than inventing a new text-layout engine.

## What YomPUB is not

YomPUB is not intended to reproduce every feature of EPUB. It is also not a fixed-layout design format, a web app bundle, or a replacement for professional page-layout software.

The question for every proposed Core feature is:

> Does a person need this to write and read an ordinary reflowable book?

If the answer is “not usually,” it probably belongs in an extension or a tool.

## Planned companion tools

These are separate from the file format itself:

- mobile-friendly open-source web viewer
- validation tool
- DOCX → YomPUB converter
- YomPUB → EPUB exporter
- YomPUB → PDF exporter
- optional editors and publishing tools

See [`docs/DESIGN_DRAFT.md`](docs/DESIGN_DRAFT.md) for the initial design notes.

## Status

**Pre-spec / experimental.** Nothing is stable yet.

The immediate goal is not to implement everything. It is to discover the smallest format that is genuinely pleasant to author and read.
