# Pyltra Roadmap

Version Status: Pre-v2 Canonicalization  
Document Role: Implementation sequence reference  
Stability: CONFIRMED DIRECTION

---

## Step 0 — Behavior Freeze

Freeze current functionality:

- output structure
- config behavior
- draft behavior
- multilingual behavior

Goal:

- prevent regressions before refactoring

---

## Step 1 — OOP Refactor

Target: v2

Goal:

- same behavior
- cleaner ownership
- Project-centered runtime

Gulp may remain temporarily during this phase.

---

## Step 2 — Validation, Logging, Utilities

Add:

- logger
- validator
- diagnostics
- file utilities

Goal:

- improve runtime visibility
- make future refactors safer

---

## Step 3 — Remove Gulp

Replace Gulp responsibilities with explicit systems.

Possible systems:

- BuildSystem
- AssetSystem
- ScssSystem
- HtmlSystem

Note: system naming may be revised globally if desired, but not inconsistently.

---

## Step 4 — Stabilize v2

Ensure:

- build stability
- serve stability
- multilingual correctness
- collection correctness

---

## Step 5 — Introduce Graph Internally

Add:

- Graph
- Node
- Edge

Filesystem remains the primary adapter at first.

---

## Step 6 — Adapter Layer

Move filesystem logic behind:

- FilesystemAdapter

Goal:

- make filesystem one source adapter rather than the runtime center

---

## Step 7 — Pipelines, Events, Plugins

Introduce:

- pipeline execution
- hooks
- plugin APIs
- event bus

Status:

- future direction, not immediate v2 requirement

---

## Step 8 — Dev Inspector / UI

Add:

- graph inspector
- visual runtime inspection
- build visualization

Only after graph stabilizes.

---

## Experimental / Future Ideas

These are not current implementation targets:

- graph inspector UI
- SaaS/cloud runtime
- database adapters
- CMS adapters
- incremental graph rebuilds
- AI graph manipulation
- visual editor
- query engine
- live graph explorer
- remote runtime execution
