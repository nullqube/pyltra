# Pyltra Code Style and Implementation Rules

Version Status: Pre-v2 Canonicalization  
Document Role: Implementation rules reference  
Stability: CONFIRMED

---

## 1. Core Rules

Pyltra code should:

- prefer composition over inheritance
- avoid global state
- avoid singleton-heavy design
- avoid utility-function sprawl
- use explicit ownership
- use async/await consistently
- avoid hidden side effects

---

## 2. Avoid

Avoid:

- enterprise-style abstraction explosion
- premature generalization
- deeply nested inheritance trees
- god classes
- scattered runtime logic
- hidden registries
- magical implicit behavior

---

## 3. Implementation Philosophy

Prefer:

- explicit code over clever code
- stable boundaries over excessive abstraction
- small focused classes over large multipurpose objects
- behavior-preserving refactors before architectural leaps

---

## 4. Refactor Rule

During v2, refactors must preserve current behavior unless a behavior change is explicitly approved.

Behavior to preserve includes:

- output structure
- config behavior
- draft behavior
- multilingual behavior
- current page/collection rendering semantics
