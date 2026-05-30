# Pyltra Naming Conventions

Version Status: Pre-v2 Canonicalization  
Document Role: Naming reference  
Stability: CONFIRMED

---

## 1. Class Naming

Use PascalCase.

Examples:

- Project
- Renderer
- FilesystemAdapter
- ValidationSystem

---

## 2. File Naming

Use PascalCase for class files during v2.

Examples:

```text
Project.mjs
Renderer.mjs
FilesystemAdapter.mjs
```

Use `.mjs` during v2.

---

## 3. System Naming

Use:

```text
XSystem
```

Examples:

- BuildSystem
- ValidationSystem
- RenderSystem
- DevServerSystem

Note: if `System` naming becomes uncomfortable later, it may be revised globally, but not casually per-file.

---

## 4. Adapter Naming

Use:

```text
XAdapter
```

Examples:

- FilesystemAdapter
- DatabaseAdapter
- CMSAdapter
- APIAdapter

---

## 5. Component Naming

Use responsibility-based names.

Examples:

- TemplateEngine
- LayoutResolver
- TemplateContextBuilder
- ConfigLoader
- ProjectScaffolder

Avoid vague names like:

- Manager
- Handler
- Helper

unless the responsibility is genuinely generic and limited.

---

## 6. Stability Rule

Naming decisions are architectural decisions.

Do not rename core concepts casually during implementation.
