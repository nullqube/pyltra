# Pyltra Configuration System

Version Status: Pre-v2 Canonicalization  
Document Role: Configuration architecture reference  
Stability: CONFIRMED

---

## 1. Config Philosophy

Config is:

- declarative
- adapter-oriented
- user-controlled

Pyltra must not enforce a rigid filesystem structure unnecessarily.

---

## 2. Current Config Responsibilities

Config currently defines:

- languages
- pages
- collections
- bundles
- paths
- site metadata

---

## 3. Future Config Responsibilities

Future config may define:

- graph bootstrap instructions
- adapter mappings
- source mappings
- runtime feature flags

Config must not become imperative runtime logic.

---

## 4. Validation Requirement

Config must be validated before systems execute.

Invalid configuration should block builds when it would produce incorrect or unsafe output.
