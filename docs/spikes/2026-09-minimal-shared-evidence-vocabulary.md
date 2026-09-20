# Spike charter: minimal shared evidence vocabulary

**Status:** active experiment; not a proposal for an approved schema.

**Related issue:** [#40](https://github.com/ajamespgh/cortado/issues/40).

## Uncertainty

What is the smallest language-neutral evidence vocabulary that can carry useful
facts from a TypeScript analyzer about a tiny real program to a downstream
consumer without exposing raw source, TypeScript syntax, or developer-assigned
symbol names?

The experiment will test whether an opaque, snapshot-scoped entity identity,
a source citation, producer provenance, evidence category, and one explicitly
named relationship are sufficient for that limited hand-off. It will also test
whether a consumer can answer a structural question from that hand-off alone.

## Constraints already decided

- The canonical knowledge layer is language-neutral; storage, MCP/API,
  visualization, detector, and ML models are projections.
- TypeScript is the first source ecosystem; Next.js is only the first
  demonstration environment.
- Stable opaque identities may correlate entities across distinct analysis
  representations, whose semantics must remain distinct.
- Evidence is conceptually observed, derived, inferred, or asserted.
- AI components receive no raw source; most do not receive developer-assigned
  symbol names.
- Human citations include project-relative path, source line/range, and
  analysis-snapshot identifier.
- Confidence semantics are unresolved and must not be invented.

## Experiment

Use the TypeScript compiler API against a deliberately tiny fixture containing
one exported function, a branch, and a call. A language-specific extractor may
inspect source and compiler nodes. It will emit a small, in-memory neutral
hand-off containing only:

- opaque, deterministic-for-the-experiment entity tokens;
- observed source facts with a citation and extractor provenance; and
- an explicit `invokes` relationship between two function entities.

A separate consumer receives only that hand-off and answers which opaque
function entities invoke another opaque function entity. The consumer must not
read the fixture or import TypeScript tooling.

## Observations to record

- Which fields were needed for the consumer's answer and which were merely
  convenient implementation details.
- Whether line/range citations are sufficient to let a human locate the fact.
- Whether TypeScript-only details can remain entirely on the extractor side.
- Whether the relationship needs an explicit representation rather than being
  inferred from source locations alone.
- Whether the experiment exposes an identity or provenance ambiguity.
- Any temptation to attach confidence, framework conventions, names, comments,
  or syntax to neutral evidence.
- Whether F# is locally available for a small boundary representation test.

## Explicitly not authorized

This spike must not decide or create:

- a final canonical evidence schema;
- persistent storage or a snapshot storage structure;
- MCP, API, or visualization contracts;
- confidence representation, calculation, or propagation;
- a universal graph abstraction;
- a language/framework extension mechanism;
- production runtime architecture; or
- final opaque-identity generation semantics.

The fixture, extractor, consumer, field names, and identity algorithm are
disposable experimental artifacts, not durable contracts.

## Possible outcomes

1. The hand-off is sufficient: recommend a follow-up spike on identity and
   provenance boundaries, without promoting this shape.
2. It is insufficient because a specific neutral concept is missing: record
   the gap and run a narrower follow-up spike.
3. It leaks TypeScript/source details or conflates analysis semantics: reject
   the hand-off and investigate a different boundary.
4. The experiment is inconclusive because the source/analyzer environment is
   unavailable: record the limitation and choose a tooling-enablement spike.
