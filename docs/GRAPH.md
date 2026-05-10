# Pyltra Graph Architecture

Version Status: Pre-v2 Canonicalization  
Document Role: Future graph architecture reference  
Stability: CONFIRMED DIRECTION  
Implementation Target: v3+

---

## 1. Graph Role

The graph is the future runtime source of truth.

The graph stores:

- content nodes
- page nodes
- collection nodes
- asset nodes
- template nodes
- relationships

---

## 2. Node Model

All runtime entities eventually become nodes.

Canonical node shape:

```js
{
  id,
  type,
  data,
  meta
}
```

---

## 3. Node Responsibilities

### 3.1 `data`

User-facing content and structured payload.

### 3.2 `meta`

Runtime/framework metadata.

Examples:

- source adapter
- source file
- draft state
- timestamps
- language
- content kind

---

## 4. Edge Model

Edges represent relationships.

Examples:

```text
article -> belongsTo -> collection
page -> uses -> template
content -> localizedAs -> language
```

---

## 5. Graph Responsibilities

Graph may:

- store nodes
- store edges
- support querying
- support mutations

Graph must not:

- render
- validate globally
- load files
- build outputs
- know about CLI commands

---

## 6. Implementation Boundary

Graph is confirmed as the future direction, but should not block the v2 OOP refactor.

v2 may use Project-centered structured state first, then introduce Graph internally after behavior is stable.
