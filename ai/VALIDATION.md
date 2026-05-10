# Pyltra Validation System

Version Status: Pre-v2 Canonicalization  
Document Role: Validation architecture reference  
Stability: CONFIRMED

---

## 1. Validation Role

Validation is a dedicated system.

Validation must not be scattered across unrelated modules.

---

## 2. Responsibilities

Validation covers:

- config validation
- template validation
- collection validation
- data validation

---

## 3. Behavior

Validation should:

- block invalid builds
- distinguish warnings from errors
- support fallback behavior where appropriate
- provide actionable diagnostics

---

## 4. Future Direction

Validation may later become a standalone package, for example:

```text
@pyltra/schema
```

This should be pursued only if the validation engine becomes reusable beyond Pyltra core.
