# Decision: first F# core-model slice

**Status:** accepted 2026-09-20.

**Decision record:** [#46](https://github.com/ajamespgh/cortado/issues/46).

## Decision

The first durable core-model implementation is an in-memory, dependency-free
F# library. It uses opaque snapshot and entity identities; validated
project-relative source ranges and citations; immediate observed-tool
provenance; authority/reference for asserted context; distinct direct-call and
conditional-branch observation types; and a pure correlation query that
retains those distinct values.

Constructors reject mixed snapshots and invalid source locations. The core
exports no raw source, syntax/AST values, developer-assigned names, generic
graph representation, confidence, serialization members, or source-language
dependencies.

The complete accepted type design is retained as the
[review proposal](../proposals/2026-09-fsharp-core-model-slice.md).

## Deferred decisions

Derived and inferred fact types, external schemas, persistence, ID generation,
cross-snapshot semantics, transitive provenance, authority conflicts,
confidence, and production runtime boundaries remain deferred.
