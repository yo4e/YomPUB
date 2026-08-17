# YomPUB Roadmap

Status: **Pre-spec / Experimental**

YomPUB is being developed as a specification, not as a feature race. The roadmap is therefore **gate-based rather than date-based**: each phase should answer a set of questions before the next phase begins.

> **NEXT: Research existing publication formats, EPUB internals, and global writing systems before defining YomPUB syntax.**

## Phase 0 — Research / Prior Art

Do not freeze syntax yet.

### 0.1 Existing formats and prior art

Investigate formats and projects that overlap with YomPUB's goals, especially:

- EPUB and related publishing standards
- Markdown-based book and publishing formats
- human-writable document/package formats
- Web-native publishing approaches
- lightweight ebook/source formats

Questions:

- Does a format already solve the problem YomPUB is trying to solve?
- If so, should YomPUB adopt, profile, or extend it rather than invent something new?
- What useful ideas should YomPUB reuse?
- What complexity can YomPUB intentionally avoid?

Output:

`docs/research/prior-art.md`

### 0.2 EPUB study

Study EPUB as a successful mature format rather than treating its complexity as accidental.

Investigate:

- package/container structure
- metadata and identifiers
- reading order and navigation
- assets and linking
- reflow and styling
- vertical writing and bidirectional text
- accessibility
- language metadata
- why each required layer exists

Questions:

- Which EPUB requirements are essential even for a tiny reflowable book format?
- Which exist because EPUB serves use cases outside YomPUB's intended Core?
- Which lessons must YomPUB preserve even if the syntax is radically simpler?

Output:

`docs/research/epub.md`

### 0.3 Global writing systems

Research writing and layout requirements before defining the Core.

At minimum investigate:

- left-to-right writing
- right-to-left writing
- mixed bidirectional text
- vertical writing
- ruby-like annotations
- scripts with complex shaping or combining characters
- line breaking in languages without spaces
- punctuation and numeric behavior across writing directions
- embedded URLs, Latin text, and numbers inside other writing directions

The goal is **not** to implement the world's typography inside YomPUB. The goal is to determine what YomPUB must express and what should be delegated to Unicode, rendering engines, browsers, and viewers.

Output:

`docs/research/writing-systems.md`

### Phase 0 exit gate

Proceed only when we can explain:

1. why YomPUB should exist alongside existing formats;
2. which EPUB concepts are essential and which are intentionally excluded;
3. what the Core must express to support international reflowable text without becoming a layout engine.

---

## Phase 1 — Define the Minimum

Use the research to define the smallest viable YomPUB document.

Decide:

- Markdown, another existing syntax, or a new minimal syntax
- exact source structure
- minimum metadata
- chapter/section structure
- images and local assets
- ruby and other publication-specific notation
- writing direction and language metadata
- whether distribution is a directory, a single file, or both
- unknown-field and extension behavior

Deliverables:

- first normative Core draft
- minimal examples
- explicit list of things intentionally excluded from Core

### Phase 1 exit gate

A person must be able to create a valid simple YomPUB book **by hand in a text editor** using only the specification.

---

## Phase 2 — YomPUB Core 0.1 Draft

Publish the first testable specification draft.

Create reference books covering at least:

- horizontal LTR
- horizontal RTL
- Japanese vertical writing
- images
- ruby or the selected annotation mechanism

Define enough syntax that an independent validator and renderer could be implemented without guessing.

Possible first version:

`0.1.0-draft.1`

See [`docs/VERSIONING.md`](docs/VERSIONING.md).

---

## Phase 3 — Reference Web Viewer

Build a small open-source reference viewer.

Minimum goals:

- mobile-friendly Web reading
- reflow
- adjustable text size
- LTR / RTL / vertical writing
- images
- publication-specific Core notation

The viewer is a **reference implementation**, not part of the file format itself.

YomPUB data should remain readable without it.

---

## Phase 4 — Experimental Release

Create and read real books with the draft format.

Stress-test:

- authoring by hand
- multilingual content
- long-form fiction and nonfiction
- asset handling
- portability
- viewer behavior
- ambiguous or awkward syntax

Breaking changes are still allowed during the `0.x` series.

When the first experimental format is useful enough for external testing, release:

**YomPUB Core 0.1.0**

---

## Phase 5 — Companion Tools

Develop outside the Core specification as separate tools or modules:

- YomPUB → EPUB
- YomPUB → PDF
- DOCX → YomPUB
- validator / linter
- browser extension
- editors or publishing helpers
- embeddable Web component
- integration with virtual spaces such as 4der

The existence of a useful tool is **not** by itself a reason to add complexity to the Core format.

---

## Phase 6 — 1.0 Gate

YomPUB Core 1.0 means **compatibility becomes a promise**.

Before 1.0, verify:

- specification ambiguity is minimized
- reference examples are comprehensive
- LTR, RTL, bidirectional, and vertical cases have been tested
- accessibility requirements have been studied and documented
- invalid-document behavior is defined
- extension behavior is defined
- at least one independent or clean-room implementation is feasible from the spec
- independent implementers, including general-purpose AI systems unfamiliar with YomPUB, can create and interpret valid documents from the published specification alone without undocumented assumptions
- real books have survived migration through the late `0.x` drafts

See [`docs/SPEC_CLARITY.md`](docs/SPEC_CLARITY.md) for the specification-clarity principle and proposed AI ambiguity test.

Only then publish:

**YomPUB Core 1.0.0**

---

## Permanent design rule

Every proposed Core feature must answer:

> **Does an ordinary reflowable book actually need this to be written, exchanged, and read?**

If not, it belongs in a viewer, converter, extension, or companion tool.
