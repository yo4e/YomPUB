# YomPUB Versioning Policy

Status: **Pre-spec / Experimental**

YomPUB treats versioning as part of the format contract, not as project decoration.

The central rule is simple:

> **YomPUB 1.0 means “compatibility promises begin here,” not “the format is finished forever.”**

## 1. Specification versions

Published YomPUB Core specifications use:

```text
MAJOR.MINOR.PATCH
```

### Before 1.0

`0.x.x` is the experimental period.

- `0.1.0` — first public experimental specification
- `0.2.0` — a new experimental specification that may break compatibility
- `0.2.1` — editorial correction that does not change meaning

Compatibility between different `0.x` versions is **not guaranteed**.

Drafts may use identifiers such as:

```text
0.1.0-draft.1
0.1.0-draft.2
```

A draft is not a published compatibility target.

## 2. After 1.0

### MAJOR

Increment MAJOR when a change can make an existing valid YomPUB document invalid, unreadable, or meaningfully different.

Examples:

- changing the meaning of existing syntax
- removing syntax or fields
- adding a new required field
- changing parsing rules incompatibly

### MINOR

Increment MINOR for backward-compatible additions.

Examples:

- a new optional metadata field
- new optional syntax that does not change existing documents
- a backward-compatible Core capability

Existing documents written for earlier versions in the same MAJOR series must retain their meaning.

### PATCH

Increment PATCH only for editorial corrections that do **not** alter format behavior.

Examples:

- typo fixes
- clearer wording
- corrected non-normative examples
- clarification that does not change validity or rendering requirements

If a change affects whether a document is valid or how it must be interpreted, it is not a PATCH.

## 3. What a book declares

A YomPUB document should declare the Core format generation using only MAJOR.MINOR:

```text
yompub: 1.0
```

The PATCH number belongs to the specification document, not to individual books.

Therefore a specification may be revised from `1.0.0` to `1.0.2` without requiring books to change from `yompub: 1.0`.

## 4. Reader compatibility

A renderer should clearly state which YomPUB Core versions it supports.

A renderer that claims support for YomPUB Core `1.4` should normally continue to support valid earlier `1.x` documents within its declared support range.

Forward compatibility is desirable but is not automatically guaranteed. The Core should nevertheless be designed so that unknown optional metadata can often be ignored safely.

## 5. Core, extensions, and software are versioned separately

The YomPUB specification version is independent from the version of any implementation.

For example:

```text
YomPUB Core 1.0
YomPUB Web Viewer 0.7.2
```

The viewer does not need to share the Core version number.

Extensions are also versioned independently:

```text
YomPUB Core 1.0
Ruby Extension 1.0
Annotations Extension 0.3
```

This keeps the Core small and prevents an extension change from forcing a new Core major version.

## 6. Published specifications remain available

Once a specification version is published, it should not be silently replaced or deleted.

Historical specifications should remain accessible so that an old YomPUB book can still be interpreted years later.

A likely repository layout is:

```text
docs/
  spec/
    0.1.md
    0.2.md
    1.0.md
  VERSIONING.md
```

Normative releases may also receive Git tags such as:

```text
spec-v0.1.0
spec-v0.2.0
spec-v1.0.0
```

Implementation releases should use distinct names, for example:

```text
viewer-v0.3.0
```

## 7. Path to 1.0

YomPUB should remain pre-1.0 while its basic grammar and authoring model are still being discovered.

Before declaring Core 1.0, the format should be exercised with real books and real renderers, including at minimum:

- ordinary reflowable prose
- images
- LTR text
- RTL text
- vertical writing
- the reference Web Viewer
- at least one export path such as EPUB

The goal is not to prove that every future feature has been designed.

The goal is to know that the small Core is stable enough to make a compatibility promise.
