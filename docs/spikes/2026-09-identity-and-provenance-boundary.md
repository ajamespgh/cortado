# Spike charter: identity and provenance across distinct representations

**Status:** active experiment; not a proposal for an approved schema.

**Related issue:** [#41](https://github.com/ajamespgh/cortado/issues/41).

## Uncertainty

Can stable opaque, snapshot-scoped experimental identities correlate evidence
from two semantically distinct analysis representations without turning those
representations into a universal graph? What immediate provenance and citation
details let a downstream consumer make a constrained, source-free query while
preserving the origin of each claim?

## Constraints already decided

- Stable opaque identities may correlate entities across semantically distinct
  program-analysis representations, whose semantics must remain distinct.
- The canonical layer is language-neutral; TypeScript-specific syntax and
  compiler data remain outside it.
- Evidence categories include observed, derived, inferred, and asserted;
  confidence is unresolved.
- Agent-visible identities are snapshot-scoped and most agents do not receive
  developer-assigned symbol names or raw source.
- Source citations include project-relative resource, source line/range, and
  analysis-snapshot identity.

## Experiment

Extend the previous disposable TypeScript compiler-API fixture. Extract two
separate in-memory representations:

- direct-call facts, each supported by observed call evidence; and
- conditional-branch facts, each supported by observed branch evidence.

Both representations may refer to the same opaque function identity within one
fixed experimental snapshot. A source-free consumer will query for opaque
functions that both contain a conditional branch and invoke another opaque
function. It must use only the hand-off, and it must preserve citations and
producer information for the evidence it returns.

## Observations to record

- Whether one identity can correlate the two representations without a generic
  node/edge type.
- Which provenance fields the consumer needs to return reviewable evidence.
- Whether cited evidence remains distinguishable by representation and source
  range.
- Whether a single evidence category is sufficient for compiler-observed facts
  in this constrained case.
- Any ambiguity involving same-snapshot identity, producer/version, source
  citation, or relation-to-evidence linkage.

## Explicitly not authorized

This spike must not decide or create:

- final opaque-identity generation or cross-snapshot stability semantics;
- final canonical evidence, provenance, or citation schema;
- persistent snapshots, storage, MCP/API, or visualization contracts;
- confidence, reliability, severity, impact, exploitability, or likelihood
  semantics;
- a universal graph abstraction;
- language/framework extension architecture; or
- production runtime or F# module architecture.

All types, object shapes, fixture details, and identity algorithms are
disposable experimental artifacts.

## Possible outcomes

1. Correlation and reviewable provenance work with separate representations:
   recommend a focused boundary/approval proposal only if the findings are
   mature enough, otherwise choose a narrower follow-up spike.
2. A specific correlation or provenance gap appears: record it and isolate it
   in the next experiment.
3. Keeping representation semantics separate prevents the intended consumer
   query: reject this approach and investigate a different projection boundary.
