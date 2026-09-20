# Spike charter: asserted evidence beside observed evidence

**Status:** active experiment; not a proposal for an approved schema.

**Related issue:** [#43](https://github.com/ajamespgh/cortado/issues/43).

## Uncertainty

Can a small F# boundary representation preserve the decided distinction between
observed and asserted evidence such that an external repository/framework claim
cannot silently stand in for compiler-observed behavioral evidence, while a
consumer may still present both kinds of evidence together for human review?

## Constraints already decided

- Evidence is conceptually observed, derived, inferred, or asserted.
- Human, agent, configuration, framework-knowledge, and other external claims
  are asserted rather than observed behavioral ground truth.
- Confidence and its propagation are unresolved and must not be invented.
- Call and control-flow representations retain distinct semantics.
- AI components receive no raw source and most do not receive actual symbol
  names.
- Important schemas require human approval.

## Experiment

Create a disposable, dependency-free F# program containing:

- compiler-observed direct-call and conditional-branch evidence;
- one asserted framework/repository claim about an opaque target entity; and
- a source-free consumer report that returns observed structure separately from
  the asserted claim and retains each evidence category, citation, and
  producer/authority information.

An intentionally invalid F# script will try to provide the asserted claim where
a direct call requires observed call evidence. The compiler must reject it.

## Observations to record

- Whether the type system prevents the asserted/observed substitution.
- Whether a consumer report can make the asserted nature and external authority
  visible without a confidence score or silent promotion.
- Which citation/provenance details fit observed versus asserted evidence in
  this narrow case.
- Whether any type design artificially forces a durable vocabulary choice.

## Explicitly not authorized

This spike must not decide or create:

- a final canonical evidence, citation, provenance, authority, or identity
  schema;
- a confidence, reliability, likelihood, severity, impact, or exploitability
  model;
- storage, snapshots, MCP/API, visualization, serialization, or ML contracts;
- final F# module/project structure, opaque-ID semantics, or extension model;
- a universal graph abstraction; or
- a detector or framework-integration behavioral requirement.

All field/type names and fixture values are disposable experimental artifacts.

## Possible outcomes

1. The distinction remains explicit and enforced: retain findings and assess
   whether the accumulated spike evidence is ready for an owner decision.
2. The types obscure or overconstrain legitimate use: record the limitation
   and run a narrower follow-up experiment.
3. The experiment requires a durable schema choice: stop and request owner
   approval rather than encoding that choice.
