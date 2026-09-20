# Findings: TypeScript-to-F# evidence hand-off

**Status:** experimental evidence, not an accepted decision, requirement, or
schema. See the [charter](./2026-09-typescript-to-fsharp-evidence-handoff.md)
and GitHub issue [#44](https://github.com/ajamespgh/cortado/issues/44).

## What was tested

A disposable TypeScript compiler-API extractor analyzed one small fixture with
one direct call and one conditional branch. It wrote two local experimental
inputs: an observed hand-off and separately supplied asserted context. The
observed input contained only opaque function IDs, representation-specific
fact kinds, observed category labels, source citations, and immediate compiler
tool provenance. It contained no raw source, AST values, or fixture symbol
names.

An F# executable received those two inputs from a fresh temporary directory.
That directory contained only the executable's build output and the input
files; it did not contain the TypeScript fixture or extractor. The F# consumer
correlated the call and branch by opaque identity while returning the asserted
context separately from both observed facts.

The automated experiment also changed an observed fact's category to
`asserted`. The F# input boundary rejected it rather than treating it as an
observed call.

## Observations

- The TypeScript compiler API can project the required direct-call and
  conditional-branch observations into a small hand-off without exporting
  AST objects, raw source, or source identifiers.
- Citation resource, line/range, and snapshot ID were sufficient for this
  experiment's human-review location. The resource path is intentional
  citation metadata, not filesystem access for the consumer.
- Opaque caller, callee, and branch-function identities were required to
  correlate the two observed representations and the asserted target claim.
- Tool name and version were enough to record immediate extractor provenance
  for the observed facts in this narrow test.
- Separate files made the asserted input visibly distinct at the boundary. The
  F# domain types also kept asserted context distinct from observed call and
  branch values after parsing.
- The F# consumer had no TypeScript reference and ran without the source
  fixture or extractor in its working directory. Its output did not expose
  fixture symbol names.
- The JSON field names, fixture tokens, IDs, input files, and F# module layout
  are disposable experiment artifacts. JSON here proves a file-local hand-off,
  not a storage, API, or serialization contract.

## Assumptions affected

- **Strengthened:** a real TypeScript extractor can preserve the earlier
  representation and evidence-category constraints across a minimal F# input
  boundary.
- **Strengthened:** a source-free consumer can correlate distinct observed
  representations using opaque IDs while receiving asserted context separately.
- **Not tested:** durable identity generation, cross-snapshot correlation,
  derived or inferred evidence, provenance chains, persistence, integrity,
  MCP/API projections, confidence, multiple assertions, or production process
  boundaries.

## Recommendation and next step

The four spikes now demonstrate a minimal end-to-end separation of observed
language facts, asserted context, representation-specific evidence, citations,
and immediate provenance. They still do not select a durable vocabulary or
contract. The next safe step is an owner-reviewed proposal for a minimal shared
evidence vocabulary; it should cite these experiments and explicitly separate
proven constraints from unresolved design choices.

## Artifact disposition

- Retain the charter, findings, extractor, fixture, F# consumer, and test as
  disposable runnable reference.
- Promote no executable code, field shape, schema, serialization format,
  persistence model, or runtime architecture.
