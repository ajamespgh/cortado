# Spike charter: TypeScript-to-F# evidence hand-off

**Status:** chartered; implementation deferred.

**Related issue:** [#44](https://github.com/ajamespgh/cortado/issues/44).

## Uncertainty

Can a real TypeScript compiler-API extractor produce a deliberately tiny,
explicit hand-off that an F# consumer can use without filesystem/source access,
TypeScript syntax objects, or developer-assigned symbol names—and can that
consumer keep separately supplied asserted context distinct from observed
language facts?

## Constraints already decided

- Cortado's canonical knowledge/evidence layer is language-neutral; TypeScript
  analysis, storage, MCP/API, visualization, detector, and ML models are
  separate representations or projections.
- F# is preferred for the core wherever practical.
- Analysis representations such as calls and control flow retain distinct
  semantics; opaque snapshot-scoped identities may correlate them.
- Observed, derived, inferred, and asserted evidence are conceptually
  distinct. Confidence remains unresolved.
- AI-powered components receive no raw source. Most agents do not receive
  developer-assigned symbol names.
- Source citations include project-relative file path, source line/range, and
  analysis snapshot identifier.
- Important schemas require human approval.

## Experiment

Use the TypeScript compiler API against one tiny fixture containing a direct
call and conditional branch. A disposable extractor must write or otherwise
provide one explicit in-memory/file-local experimental hand-off consisting only
of opaque IDs, observed facts, supporting citations, and immediate extractor
provenance. It must exclude raw source, AST nodes, and source identifiers.

An F# consumer receives only that hand-off plus a separately supplied asserted
framework/repository claim. It answers one constrained correlation question and
returns observed and asserted material distinctly. The experiment must make
source access unavailable by construction to the F# consumer rather than merely
relying on the consumer not to look.

## Observations to record

- Whether the extractor can limit the hand-off to the required neutral facts.
- Whether F# can consume that hand-off without acquiring TypeScript or source
  dependencies.
- Which fields are necessary for opaque identity correlation, citations, and
  immediate provenance.
- Whether observed and asserted evidence remain distinct from extraction through
  consumption.
- Any information leak through payload fields, diagnostics, paths, tool output,
  or fixture structure.
- Any forced choice that begins to resemble a durable schema, serialization,
  storage, or runtime contract.

## Explicitly not authorized

This spike must not decide or create:

- a final canonical evidence, identity, citation, provenance, authority, or
  confidence schema;
- snapshot persistence, storage, integrity, MCP/API, visualization, ML, or
  serialization contracts;
- final opaque-ID generation or cross-snapshot behavior;
- production TypeScript/F# process boundaries, package layout, or runtime
  architecture;
- a universal graph abstraction, extension mechanism, detector contract, or
  framework-integration requirement; or
- any exception to information-isolation rules.

All fixture data, hand-off shape, file format (if any), field names, and module
layout are disposable experimental artifacts.

## Possible outcomes

1. The hand-off preserves the required boundaries: record the smallest proven
   field set and assess whether accumulated evidence is ready for an
   owner-reviewed vocabulary proposal.
2. The hand-off leaks source/language details or conflates evidence categories:
   reject the shape and isolate the failure in a follow-up spike.
3. A missing neutral concept is demonstrated: record it as an experiment result
   without adding it to a durable schema.
4. A durable-contract decision becomes necessary: stop and request owner
   approval before encoding it.
