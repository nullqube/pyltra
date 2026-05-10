# Pyltra Renderer Architecture

Version Status: Pre-v2 Canonicalization  
Document Role: Rendering and template architecture reference  
Stability: CONFIRMED

---

## 1. Renderer Role

Renderer transforms runtime content state into output artifacts.

Renderer operates on:

- Project
- graph nodes or structured project state
- templates
- routes
- render context

Renderer must not:

- read filesystem directly
- discover content
- own content loading
- mutate project configuration

---

## 2. Template Engine

Canonical initial engine:

```text
Nunjucks
```

---

## 3. Rendering Responsibilities

Renderer is responsible for:

- resolving templates
- resolving layouts
- building template context
- rendering pages
- rendering collection items
- writing HTML output through the appropriate output layer

---

## 4. Internal Components

Renderer should not become monolithic.

Preferred components:

```text
TemplateEngine
LayoutResolver
TemplateContextBuilder
Renderer
```

---

## 5. Template Filters

Supported filter direction:

- markdown
- slugify
- truncate
- date
- json

---

## 6. Template Context

Template context is built from:

- runtime state / graph state
- pages
- collections
- globals
- localization data

The context builder owns context shape. Templates should not depend on internal runtime objects directly.
