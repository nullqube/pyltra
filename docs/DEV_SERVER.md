# Pyltra Dev Server Architecture

Version Status: Pre-v2 Canonicalization  
Document Role: Dev server architecture reference  
Stability: CONFIRMED

---

## 1. Dev Server Role

The dev server supports local development workflows.

---

## 2. Responsibilities

The dev server is responsible for:

- serving `dist/`
- watching filesystem changes
- triggering rebuilds
- supporting live reload

File changes are debounced for 300 ms after the last event. Rebuilds run one at
a time; changes received during a build are batched into a follow-up rebuild
once the current build finishes and the debounce delay has elapsed. A batch
containing any non-style file triggers a full browser reload; CSS/SCSS-only
batches reload styles.

---

## 3. Boundaries

The dev server must not own core build logic.

It should invoke build/runtime systems rather than duplicating their behavior.

---

## 4. Future Direction

Status: EXPERIMENTAL

Potential future capabilities:

- graph-aware incremental rebuilds
- HMR-like behavior
- graph invalidation
- runtime inspection
