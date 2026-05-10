# Pyltra — Architecture

Status: CONFIRMED

---

# Core Architectural Principles

## 1. Data-Oriented Runtime

Core principle:

> Projects are data. Systems perform work.

Meaning:

* Project owns structured state
* Systems operate on Project state
* Execution logic is separated from state

---

## 2. Filesystem is an Adapter

Filesystem is NOT the source of truth.

Filesystem is:

* an input/output adapter
* one persistence layer

Future adapters may include:

* database
* CMS
* API
* AI-generated content

---

## 3. Graph-Centric Runtime

All runtime entities eventually become:

* nodes
* edges
* graph relationships

The graph is the central runtime representation.

---

## 4. System-Oriented Execution

Rendering, validation, building, serving, etc. are:

* systems
* engines
* execution subsystems

NOT responsibilities of Project itself.

---

## 5. Local-First

Pyltra must:

* work fully offline
* avoid cloud dependency
* preserve filesystem transparency
* preserve user ownership of content

Cloud/SaaS support is optional and additive.

---

## 6. Progressive Complexity

Architecture target:

```text
Simple by default
Powerful when needed