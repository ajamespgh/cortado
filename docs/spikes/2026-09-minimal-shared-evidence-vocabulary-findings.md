# Findings: minimal shared evidence vocabulary spike

**Status:** experimental evidence, not an accepted decision, requirement, or
schema. See the [charter](./2026-09-minimal-shared-evidence-vocabulary.md) and
GitHub issue [#40](https://github.com/ajamespgh/cortado/issues/40).

## What was tested

A disposable TypeScript compiler-API extractor analyzed a tiny fixture with two
functions, one branch, and one direct call. The extractor emitted in-memory
objects for opaque function entities, observed evidence, source citations,
extractor provenance, and one explicit `invokes` relationship. A separate
consumer queried callers using only those objects. It neither read the fixture
nor imported TypeScript.

The experiment's IDs are deterministic hashes of local fixture positions. They
are intentionally not an identity-design recommendation.

## Observations

- The consumer could identify a caller from opaque IDs and an explicit
  relationship; it needed neither TypeScript AST nodes nor raw source.
- The minimum citation contract was practical for each observation: a
  project-relative resource, one-based source range, and snapshot ID.
- Tool name and version were enough to identify the immediate extractor in
  this narrow test. This does not answer how full provenance chains or producer
  ownership should work.
- The relationship had to be explicit. Citation ranges alone could locate a
  call but did not tell the consumer its resolved target.
- The branch remained a TypeScript-analysis fact and was not forced into this
  relationship model. This strengthens the constraint that control-flow and
  call relationships must keep distinct semantics rather than share a
  universal graph abstraction.
- The extractor used function names only internally to resolve the TypeScript
  call. The hand-off contained neither of the fixture's developer-assigned
  names. This strengthens, but does not prove, the information-isolation
  direction for this kind of fact.
- All emitted evidence was labeled `observed`; no confidence, reliability,
  vulnerability likelihood, severity, impact, exploitability, inference, or
  assertion was invented.
- F# tooling is absent in this environment (`dotnet` was not found). The
  boundary therefore was not exercised with an F# type. Installing a runtime
  solely for this disposable spike was not necessary.

## Assumptions affected

- **Strengthened:** one useful cross-boundary consumer question can be answered
  with opaque identities, citations, provenance, evidence category, and an
  explicitly semantic relationship.
- **Strengthened:** TypeScript-specific syntax and developer names need not
  cross that boundary for direct-call knowledge.
- **Disproved for this slice:** source location alone is enough for downstream
  relationship queries.
- **Not tested:** aliases/imports, methods, overloads, dynamic dispatch,
  framework routes, cross-file calls, identity stability across snapshots,
  snapshot integrity metadata, inference/assertion, and transitive provenance.

## Recommendation and next step

Do not promote the experimental object shape. It is too small to establish a
canonical schema and its identity/provenance choices are deliberately
unexamined.

The most useful next spike is a narrowly chartered identity-and-provenance
boundary experiment. It should compare same-snapshot correlation across two
distinct representations (for example, a declaration/call fact and a
control-flow fact) while preserving their semantics, and test which citation
and producer details a human review needs. It must not decide durable identity
generation, storage, or a graph substrate.

## Artifact disposition

- Retain the charter and findings as experimental reference in `docs/spikes/`.
- Retain `spikes/minimal-evidence-vocabulary/` only as a disposable, runnable
  reference until a later owner decision says otherwise.
- Promote no code, schema, requirement, or decision from this spike.
