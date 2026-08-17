# YomPUB — Specification Clarity

Status: **Design principle / Pre-spec**

YomPUB should be clear enough that a person, program, or AI system with no prior YomPUB-specific knowledge can read the specification and produce a valid YomPUB document without relying on undocumented conventions.

This is not an "AI feature." It is a quality requirement for the specification itself.

## Core principle

> **A specification should be sufficient to create and interpret YomPUB without guesswork.**

A useful target is:

> **Give an unfamiliar AI system the YomPUB specification and an ordinary manuscript, ask it to convert the manuscript to YomPUB, and the result should be valid without YomPUB-specific prompting tricks or hidden knowledge.**

The same standard applies to human implementers and independent tools.

## What this implies

The specification should:

- define required and optional fields precisely;
- define defaults explicitly;
- define syntax and escaping rules without relying on examples alone;
- distinguish invalid input from valid-but-unsupported input;
- define unknown-field and extension behavior;
- define character encoding and text-order requirements;
- define asset-path and package rules precisely;
- avoid phrases such as "normally," "as appropriate," or "obvious from context" when interoperable behavior depends on them;
- include normative examples and edge cases where prose could be interpreted in more than one way.

## AI as an ambiguity test

Multiple general-purpose AI systems can be used as specification test subjects.

A possible conformance exercise:

1. provide each system with the same YomPUB specification and the same source manuscript;
2. do not provide hidden examples or YomPUB-specific instructions beyond the specification;
3. ask each system to create a YomPUB document;
4. validate all outputs with the reference validator;
5. compare places where the systems made different structural choices;
6. treat unexplained divergence as evidence that the specification may be ambiguous.

AI disagreement does not automatically mean the specification is wrong, but it is a useful signal for review.

## Desired property

YomPUB should aim to be:

**Human-writable, machine-understandable, and specification-complete.**

The goal is not that every implementation emits byte-for-byte identical files. The goal is that independent implementations can produce documents that are valid, interoperable, and equivalent in meaning.

## 1.0 readiness criterion

Before YomPUB Core 1.0, test whether independent implementers — including general-purpose AI systems unfamiliar with YomPUB — can create and interpret valid documents from the published specification alone.

If they repeatedly need undocumented assumptions, the specification is not ready for 1.0.
