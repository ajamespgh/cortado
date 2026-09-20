# Decision: minimum durable evidence vocabulary

**Status:** accepted 2026-09-20.

**Decision record:** [#45](https://github.com/ajamespgh/cortado/issues/45).

## Decision

The first durable Cortado core-model boundary uses the following
language-neutral concepts and invariants. This decision approves concepts and
invariants only; it does not select a concrete type system, field names, wire
format, or runtime boundary.

- Every fact and citation is scoped to an immutable analysis snapshot.
- Opaque identities scoped to that snapshot may correlate subjects and
  participants across distinct analysis representations. They do not expose
  developer-assigned names or source syntax by default.
- Every evidence item is exactly one category: **observed**, **derived**,
  **inferred**, or **asserted**. Categories remain explicit through
  construction and projections; asserted context must not silently become
  observed behavioral evidence.
- Facts retain their representation-specific semantics. A direct-call fact and
  a conditional-branch fact remain distinct even when correlated by identity;
  the core does not require a universal node-and-edge graph.
- A consumer-required semantic relationship is explicit evidence or a
  representation-specific fact. A source location alone is not a semantic
  relationship.
- Observed source-backed evidence carries a human-reviewable citation with a
  project-relative resource path, source range, and analysis-snapshot identity.
- Observed evidence identifies its immediate analyzer/tool and version or
  equivalent build identity. Asserted evidence identifies its supplying
  authority and reference.
- Language-specific extractors may use raw source, syntax, and names
  internally. The core boundary and ordinary agent-facing projections exclude
  those values by default. A citation permits human review but does not grant
  filesystem access.

## Rationale

The decision is based on four disposable experiments that tested a minimal
TypeScript evidence hand-off, same-snapshot cross-representation correlation,
the F# distinction between observed and asserted evidence, and an isolated
TypeScript-to-F# hand-off. Their findings are collected in the
[review proposal](../proposals/2026-09-minimal-durable-evidence-vocabulary.md).

## Deferred decisions

The following remain deliberately unresolved and need a later decision before
becoming durable:

- concrete domain types, field names, constructors, module/package layout;
- JSON, file, MCP/API, visualization, detector, ML, or storage schemas;
- snapshot persistence, integrity, retention, and deletion;
- opaque-ID generation, collision handling, display, and cross-snapshot use;
- transitive provenance, authority ranking, citation use by every category,
  and conflicting assertions;
- confidence, reliability, severity, impact, exploitability, and inference
  propagation;
- universal graph abstractions, extension mechanisms, and production runtime
  boundaries; and
- any broader raw-source or developer-name access.

## Consequences

Future core-model work may enforce these invariants with F# types and
regression tests. Concrete schemas and all deferred concerns remain outside
that authorization.
