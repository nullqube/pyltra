# Pyltra CLI Architecture

Version Status: Pre-v2 Canonicalization  
Document Role: CLI architecture reference  
Stability: CONFIRMED

---

## 1. CLI Role

CLI is an interface layer.

CLI is not the core runtime.

---

## 2. Responsibilities

CLI may:

- parse commands
- parse flags
- create or invoke runtime entrypoints
- call systems through the engine/runtime API
- display terminal output

CLI must not:

- own build logic
- own rendering
- own validation
- directly mutate runtime internals

---

## 3. Future Direction

CLI commands may later be registered through a command registry, especially after plugin support is introduced.
