# Pyltra Plugin System

Version Status: Pre-v2 Canonicalization  
Document Role: Future plugin architecture reference  
Stability: EXPERIMENTAL  
Implementation Target: v4+

---

## 1. Plugin Philosophy

Plugins extend Pyltra without modifying core.

Plugins may eventually extend:

- systems
- pipelines
- adapters
- hooks
- commands
- template filters

---

## 2. Design Direction

Pyltra plugin architecture should be closer to:

- Vite
- Rollup

than to highly complex plugin ecosystems.

---

## 3. Current Rule

Do not implement a full plugin system before core runtime, graph direction, and pipeline boundaries are stable.

---

## 4. Design Constraint

Core architecture should not block plugins later.

This means:

- avoid hardcoded execution paths where extensibility is expected
- avoid global hidden registries
- keep system boundaries explicit
