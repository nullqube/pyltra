# Pyltra Runtime Model

Version Status: Pre-v2 Canonicalization  
Document Role: Runtime lifecycle reference  
Stability: CONFIRMED

---

## 1. Canonical Lifecycle

```text
Create Project
    ↓
Load Config
    ↓
Adapters Populate Runtime State / Graph
    ↓
Systems Execute
    ↓
Outputs Generated
```

---

## 2. Runtime Phases

### 2.1 Initialization

Creates the Project instance and prepares runtime context.

### 2.2 Configuration

Loads, parses, and validates configuration.

### 2.3 Hydration

Adapters populate Project state or graph state.

### 2.4 Processing

Systems execute against runtime state.

### 2.5 Output

Build artifacts are written to the output target, usually `dist/`.

---

## 3. Canonical Data Flow

```text
Filesystem
    ↓
FilesystemAdapter
    ↓
Parsers
    ↓
Runtime State / Graph Nodes
    ↓
Systems
    ↓
Renderer / Builder
    ↓
dist/
```

---

## 4. Runtime Ownership

Project owns state.

Systems own behavior.

Adapters own source translation.

Renderer owns output transformation.

CLI owns command invocation only.

---

## 5. Runtime Rule

No subsystem should bypass the runtime model for convenience.

For example:

- Renderer must not scan source files.
- CLI must not perform rendering logic.
- Graph must not know where filesystem content came from.
