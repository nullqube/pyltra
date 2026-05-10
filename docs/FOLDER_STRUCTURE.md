# Pyltra Folder Structure

Version Status: Pre-v2 Canonicalization  
Document Role: Source tree structure reference  
Stability: CONFIRMED for v2, CONFIRMED DIRECTION for v3+

---

## 1. v2 Structure

Status: CONFIRMED

```text
src/
├── core/
├── project/
├── data/
├── renderer/
├── systems/
├── commands/
├── cli/
└── utils/
```

---

## 2. v2 Intent

v2 is focused on:

- OOP refactor
- behavior preservation
- clearer ownership
- gradual migration away from Gulp
- preparing for graph/runtime architecture

---

## 3. v3+ Structure

Status: CONFIRMED DIRECTION

```text
src/
├── app/
├── graph/
├── adapters/
├── systems/
├── project/
├── engine/
├── pipeline/
├── plugins/
├── events/
├── ui/
└── utils/
```

---

## 4. Migration Rule

Do not jump to the full v3+ structure before v2 behavior is stable.

The architecture should evolve through controlled migration, not a full rewrite.
