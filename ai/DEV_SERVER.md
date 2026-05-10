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
