# Proposal: first F# core-model slice

**Status:** accepted 2026-09-20; superseded as the review artifact by the
[accepted decision](../decisions/2026-09-first-fsharp-core-model-slice.md).

**Related issue:** [#46](https://github.com/ajamespgh/cortado/issues/46).

## Decision requested

Approve this internal F# type design for the first core-model slice. It is a
concrete implementation of the accepted invariants in
[the evidence-vocabulary decision](../decisions/2026-09-minimum-durable-evidence-vocabulary.md),
not an external schema or a production process design.

## Proposed internal model

The following names describe the proposed public surface of one in-memory F#
library. The library exports values and query functions, not serialization
types.

```fsharp
type SnapshotId
type EntityId // constructed with a SnapshotId; equality retains that scope

type SourceRange =
    { Resource: ProjectRelativePath
      Start: SourcePosition
      End: SourcePosition }

type Citation =
    { Snapshot: SnapshotId
      Range: SourceRange }

type AnalyzerProvenance =
    { Tool: AnalyzerName
      BuildIdentity: AnalyzerBuildIdentity }

type AuthorityReference =
    { Authority: AuthorityName
      Reference: string }

type DirectCallObservation
type ConditionalBranchObservation
type AssertedContext
```

`DirectCallObservation` has opaque caller and callee `EntityId` values, a
`Citation`, and `AnalyzerProvenance`. `ConditionalBranchObservation` has an
opaque subject `EntityId`, a `Citation`, and `AnalyzerProvenance`.
`AssertedContext` has an opaque target `EntityId` and `AuthorityReference`.
All observation constructors reject mixed snapshot values, including a citation
whose snapshot differs from the fact subject(s).

The types expose no raw source, syntax/AST value, symbol name, generic edge,
confidence, or serialization member. Their constructors are the only way to
create valid facts. Source positions use line and column values; the
constructor rejects an end position preceding its start. `ProjectRelativePath`
rejects absolute and parent-traversal paths.

## Category treatment

Observed call and branch facts have distinct types, so their category and
representation are enforced by construction rather than represented as a
mutable string. `AssertedContext` is a separate type and cannot be supplied
where an observed fact is required.

The accepted `derived` and `inferred` categories are named in the shared
vocabulary but have no first-slice fact types. Adding either requires a later
proposal that specifies its evidence inputs and provenance rules. This avoids
inventing confidence or provenance-chain semantics merely to make the category
set exhaustive in this first implementation.

## Proposed query boundary

One pure query accepts a selected opaque target, direct-call observations,
conditional-branch observations, and asserted context. It returns a report
only where the call caller, branch subject, and asserted target correlate in
one snapshot. The report retains the three distinct values; it does not turn
them into generic evidence records or graph edges.

## Required regression checks

- A direct call cannot be constructed from branch evidence, and a branch cannot
  be constructed from call evidence.
- Asserted context cannot substitute for an observed call or branch.
- A call, branch, citation, or assertion that combines multiple snapshots is
  rejected.
- The query correlates facts with the same opaque identity and returns their
  separate types.
- No exported core-model value carries a source-text, TypeScript syntax, or
  developer-name field.
- The build uses only the .NET/F# standard library; it imports neither
  TypeScript nor a serialization package.

## Explicitly not decided

This proposal does not decide the eventual namespace/package layout, external
visibility of identifiers, ID generation, persistence, JSON/MCP/API shape,
cross-snapshot correlation, transitive provenance, authority conflicts,
confidence, or a TypeScript-to-F# runtime boundary. The shown names and
in-memory constructors become durable only if this proposal is approved.
