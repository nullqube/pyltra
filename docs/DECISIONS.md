# Pyltra Architecture Decisions

Version Status: Pre-v2 Canonicalization  
Document Role: Architecture Decision Record  
Stability: CONFIRMED

---
# ADR-000 — QUALITY IS WHAT I BELEIVE AND CARE MOST ABOUT

Status: CONFIRMED

## Decision

Quality of each peace must be on highest possible.

## Rationale

Each peace and the whole app should be ready for any situation and battle proof.

## Consequences

-

---

# ADR-001 — Pyltra Is Local-First

Status: CONFIRMED

## Decision

Pyltra is local-first by default.

## Rationale

Users should own their content and be able to build projects without cloud dependency.

## Consequences

- Core runtime must work offline.
- Cloud/SaaS support must remain optional.
- Filesystem transparency must be preserved.

---

# ADR-002 — Filesystem Is an Adapter

Status: CONFIRMED

## Decision

Filesystem is treated as an adapter, not as the runtime core.

## Rationale

This enables future database, CMS, API, and AI-backed sources.

## Consequences

- Renderer must not directly read files.
- Filesystem logic must move behind FilesystemAdapter.
- Runtime state or graph becomes the canonical internal representation.

---

# ADR-003 — Project Owns State, Systems Own Behavior

Status: CONFIRMED

## Decision

Project is a structured runtime domain object. Systems execute behavior against Project state.

## Rationale

This separates data ownership from execution logic and prevents Project from becoming a god class.

## Consequences

- Project must not become renderer, builder, validator, or dev server.
- Systems receive or access Project state explicitly.
- Runtime ownership remains inspectable.

---

# ADR-004 — Graph Is the Future Runtime Source of Truth

Status: CONFIRMED DIRECTION

## Decision

Pyltra will move toward a graph-centered runtime model.

## Rationale

A graph model supports content relationships, localization, adapters, inspection, and future visual tooling.

## Consequences

- v2 should prepare for graph adoption.
- Graph introduction should happen after behavior is stable.
- Filesystem should not remain hardwired into rendering.

---

# ADR-005 — Nunjucks Is the Initial Template Engine

Status: CONFIRMED

## Decision

Nunjucks remains the canonical initial template engine.

## Rationale

It supports the current project direction and existing rendering behavior.

## Consequences

- Renderer should wrap Nunjucks behind TemplateEngine.
- Template logic should not leak into unrelated systems.
- Future template engines may be possible, but are not a v2 priority.

---

# ADR-006 — Validation Is a Dedicated System

Status: CONFIRMED

## Decision

Validation is handled by a dedicated validation system.

## Rationale

Scattered validation leads to inconsistent behavior and poor diagnostics.

## Consequences

- Config validation must happen before build execution.
- Validation should distinguish warnings and errors.
- Diagnostics should be structured and actionable.

---

# ADR-007 — Logging Is a Dedicated Subsystem

Status: CONFIRMED

## Decision

Logging is implemented as a dedicated subsystem.

## Rationale

Pyltra needs readable development output, quieter production output, and future transport support.

## Consequences

- Avoid scattered `console.log`.
- Logger must support grouping and indentation.
- Structured/file/dev-inspector transports can be added later.

---

# ADR-008 — v2 Must Preserve Existing Behavior

Status: CONFIRMED

## Decision

The v2 refactor must preserve existing behavior while improving ownership and structure.

## Rationale

Major behavior changes during architectural refactor increase risk and make debugging harder.

## Consequences

- Freeze current output behavior first.
- Refactor incrementally.
- Verify behavior after each major change.

---

# ADR-009 — Plugins Are Future Extension Mechanism

Status: EXPERIMENTAL

## Decision

Plugins are the likely future extension mechanism.

## Rationale

Plugins allow adapters, systems, hooks, and pipelines to be extended without modifying core.

## Consequences

- Core should avoid patterns that would block plugins later.
- Plugin API should not be implemented prematurely.
- Plugin architecture belongs after the core runtime stabilizes.
