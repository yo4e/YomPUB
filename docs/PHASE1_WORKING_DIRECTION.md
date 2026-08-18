# YomPUB — Phase 1 Working Direction

Status: **Tentative / not yet a specification**  
Decision date: **2026-08-18**

This note records the current human decision and working product direction after reviewing the Phase 0 research and the additional Markua comparison in `docs/research/markua-yompup-strategy-ja.md`.

It is intentionally provisional. Nothing in this document should be treated as finalized syntax or a compatibility promise.

## Decision after the Markua review

**Continue YomPUB.**

The reason is no longer simply “make a Markdown-like format for books.” Markua already demonstrates that a mature CommonMark-derived publishing language can cover that space well.

YomPUB should instead pursue a narrower identity:

> **A tiny, implementation-neutral, human-writable source format for ordinary reflowable books, with international text — including Japanese requirements — treated carefully from the Core rather than added later.**

Markua remains important prior art and a conversion/interoperability target, not an enemy to reimplement feature-for-feature.

The project should continue only while the Core remains meaningfully smaller and easier to understand and independently implement than a broad publishing language.

## Current working Core shape

The following is the current human-level direction for what a useful tiny Core probably needs. This list is **under discussion**.

### Clearly wanted in or directly supported by Core

- ordinary prose and chapter/section structure
- hyperlinks, including ordinary external links and a path toward internal links
- figures / images with relative local paths and alternative text
- basic bibliographic information
- language metadata
- base text direction
- writing mode, including Japanese vertical writing
- minimal ruby semantics

### Cover

A book should be able to identify a **cover image**, but a cover should be **optional**.

The cover should be an explicit semantic role rather than an inference such as “the first image is the cover.” A simple local image reference is the preferred direction.

### Table of contents

A table of contents belongs to the ordinary book experience, but YomPUB should avoid making authors maintain duplicate TOC data when the structure can be derived.

The preferred direction is:

- headings / book structure are Core;
- a viewer or exporter derives the ordinary TOC from that structure;
- explicit TOC authoring is added only if real books demonstrate a need that cannot be represented by the normal structure.

In other words, **TOC capability is important, but authored TOC data should not automatically become mandatory Core syntax.**

### Bibliographic information

YomPUB should carry enough metadata for a book to remain identifiable when exchanged independently of a specific service or tool.

Current likely basics include:

- title
- author / creator
- language
- optional cover reference

Additional bibliographic fields such as publisher, ISBN, series, edition, contributors, subjects, or rights should not enter Core merely because EPUB or library systems can represent them. Each field should need a concrete interoperability use case.

## Audio and video

Audio and video were considered, but the current direction is to **leave them out of the initial Core**.

Supporting embedded media quickly introduces questions about codecs, fallback behavior, controls, captions/transcripts, accessibility, remote versus packaged resources, file size, security/privacy, and viewer capability.

Those are legitimate publication concerns, but they are not necessary to prove the value of a tiny format for ordinary reflowable books. They can be revisited later as extensions or tooling if real use cases justify them.

## Why Japanese still matters

YomPUB should not become a Japanese-only format. However, Japanese is a valuable design test because ordinary books can require semantics that simplistic Markdown-for-books approaches tend to flatten or defer:

- vertical writing intent
- ruby as a base-text ↔ annotation relationship
- language information distinct from writing direction
- preservation of source meaning while actual typesetting is delegated to Unicode, CSS/browser layout, fonts, and other mature text systems

If the Core can stay tiny while handling Japanese carefully, and the same model also behaves correctly for RTL and other writing systems, that is a meaningful reason for YomPUB to exist.

The goal is not to encode Japanese typesetting rules into the source format. The goal is to preserve the small amount of author intent that a renderer must not have to guess.

## Guardrail against feature growth

For every proposed Core feature, ask:

1. Is this part of the meaning of an ordinary reflowable book, or merely a production convenience?
2. Will information be lost when a book moves between independent implementations without it?
3. Can it be derived from existing structure instead of authored separately?
4. Can it live in a viewer, converter, exporter, or optional extension instead?
5. Does adding it materially increase the amount of the format that an author or implementer must understand?

The intended advantage of YomPUB is not just that a trivial document looks simple. **The whole Core should remain small enough for one person to understand.**

## Current shorthand

At this stage, the rough v0 mental model is:

> **prose + structure + images + optional cover + links + minimal bibliography + language/direction/writing-mode + ruby**

with ordinary TOC derived from structure, and audio/video excluded from the initial Core.

This is a working direction, not the final Phase 1 specification.
