# Findings: F# constraints at an evidence boundary

**Status:** experimental evidence, not an accepted decision, requirement, or
schema. See the [charter](./2026-09-fsharp-evidence-boundary.md) and GitHub
issue [#42](https://github.com/ajamespgh/cortado/issues/42).

## What was tested

A disposable, dependency-free F# program represented direct-call facts and
conditional-branch facts as separate types. Both used an opaque experimental
function identity in one fixed snapshot. The consumer found an opaque caller
that both called a selected target and had a conditional branch, returning the
separate evidence values with their attached citation and producer values.

The experiment also compiled an intentionally invalid F# script that supplied
`BranchEvidence` to `DirectCall.create`, which requires `CallEvidence`.

## Observations

- F#'s distinct wrapper types rejected the intended invalid combination at
  compile time: `FS0001` reported that `CallEvidence` was expected but
  `BranchEvidence` was supplied.
- The consumer joined direct-call and control-flow facts only through opaque
  function identity, while its result retained two representation-specific
  evidence types. No generic graph edge or universal evidence wrapper was
  needed for the query.
- Citation and immediate producer metadata stayed attached to the observation
  represented by each evidence wrapper. The consumer did not need source text
  or developer-assigned names.
- F# project files require explicit source-file inclusion and ordering. This is
  an F# build-tooling fact, not a recommendation for the future Cortado project
  layout.
- The installed SDK is .NET 10.0.112 / F# 10.0. The experiment intentionally
  does not pin that version in a repository `global.json`.

## Assumptions affected

- **Strengthened:** F# can express useful local constraints that preserve the
  distinction between call and control-flow evidence.
- **Strengthened:** representation-specific evidence can accompany a
  source-free, opaque-identity query without collapsing its semantics.
- **Not tested:** source extraction in F#, cross-file or cross-snapshot
  identity, evidence categories other than observed, inference provenance,
  persistence, MCP/API projections, serialization, or production module
  boundaries.

## Recommendation and next step

Do not promote these types. They encode only one narrow experiment and would
prematurely choose names, construction boundaries, citation shape, and
provenance placement.

Before a durable schema proposal, run one final small boundary experiment that
introduces one non-observed evidence category—preferably a clearly asserted
repository/framework claim—alongside observed language facts. It should test
whether the F# types can prevent an asserted claim from being silently treated
as an observed behavioral fact, without deciding confidence semantics,
storage, or API serialization.

## Artifact disposition

- Retain the charter, findings, and F# source as disposable runnable reference.
- Retain the negative F# script as evidence of the compile-time constraint.
- Ignore generated `bin/` and `obj/` output.
- Promote no code, schema, requirement, or decision.
