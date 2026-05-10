# Pyltra Adapter System

Version Status: Pre-v2 Canonicalization  
Document Role: Adapter architecture reference  
Stability: CONFIRMED

---

## 1. Adapter Role

Adapters translate external sources into runtime state.

Adapters may:

- read from sources
- transform source data
- synchronize external state
- emit runtime nodes or structured project data

Adapters must not:

- render output
- own build logic
- globally validate unrelated subsystems
- bypass Project/runtime state

---

## 2. Initial Adapter

Initial implementation:

```text
FilesystemAdapter
```

Responsibilities:

- scan source files
- parse content
- normalize content records
- create runtime state or graph nodes

---

## 3. Future Adapters

Status: EXPERIMENTAL

Potential future adapters:

- DatabaseAdapter
- CMSAdapter
- APIAdapter
- AIContentAdapter

These are not v2 implementation targets.
