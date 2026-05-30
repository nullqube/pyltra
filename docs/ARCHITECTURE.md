# Pyltra Architecture

Version Status: Pre-v2 Canonicalization  
Document Role: Authoritative architecture reference  
Stability: CONFIRMED, unless explicitly marked otherwise

---

## 1. Core Architectural Principles

### 1.1 Data-Oriented Runtime

Core principle:

> Projects are data. Systems perform work.

Meaning:

- Project owns structured state.
- Systems operate on Project state.
- Execution logic is separated from state.

---

### 1.2 Filesystem Is an Adapter

Filesystem is not the runtime source of truth.

Filesystem is:

- an input adapter
- an output adapter
- one persistence layer

Future adapters may include:

- database adapters
- CMS adapters
- API adapters
- AI-generated content adapters

---

### 1.3 Graph-Centric Runtime

All runtime entities eventually become:

- nodes
- edges
- graph relationships

The graph is the central runtime representation.

Status: CONFIRMED DIRECTION  
Implementation Target: v3+

---

### 1.4 System-Oriented Execution

Rendering, validation, building, serving, and related behaviors are handled by systems, engines, or execution subsystems.

They are not responsibilities of Project itself.

---

## 2. Runtime Model

Canonical runtime flow:

```text
Adapters
   ↓
Project / Graph
   ↓
Systems
   ↓
Outputs
```

---

## 3. Project

Project represents:

- loaded project state
- graph container
- configuration
- runtime context

Project is not:

- renderer
- build engine
- dev server
- validator

Project is a structured runtime domain object.

---

## 4. Systems

Systems execute logic against Project state.

Examples:

- RenderSystem
- BuildSystem
- ValidationSystem
- DevServerSystem

Systems:

- do not own project state
- do not own persistence
- operate on graph/runtime data

---

## 5. Adapters

Adapters import and export data into the runtime graph or project state.

FilesystemAdapter is the first implementation.

Adapters may:

- read
- transform
- synchronize

Adapters must not:

- render
- own build logic
- globally validate the entire project

---

## 6. Renderer

The renderer transforms graph/content state into output artifacts.

Renderer operates on:

- Project
- graph nodes
- templates
- routes

Renderer must not:

- read filesystem directly
- own content loading

---

## 7. Configuration

Config is:

- declarative
- adapter-oriented
- user-controlled

Config defines project intent. It must not become runtime logic.

Current config responsibilities:

- languages
- pages
- collections
- bundles
- paths
- site metadata

Future config responsibilities:

- graph bootstrap definitions
- adapter mapping instructions

---

## 8. Dependency Rules

Allowed conceptual direction:

```text
Adapters → Runtime State / Graph → Systems → Outputs
```

Forbidden rules:

- Systems must not directly read filesystem.
- Systems must not arbitrarily mutate config structure.
- Graph must not depend on renderer.
- Graph must not depend on adapters.
- CLI must not contain runtime logic.
- Renderer must not perform content discovery.

---

## 9. Architectural Invariants

These must remain true across future versions.

### Invariant 1

Filesystem is an adapter, not the runtime core.

### Invariant 2

Project owns structured state, not execution logic.

### Invariant 3

Systems execute behavior against Project/Graph.

### Invariant 4

Graph/runtime state must remain inspectable.

### Invariant 5

Core runtime must remain local-first.

### Invariant 6

The architecture must support CLI, future UI, and future API without rewriting core systems.

### Invariant 7

Pipelines, plugins, and events must extend systems without tightly coupling subsystems.
