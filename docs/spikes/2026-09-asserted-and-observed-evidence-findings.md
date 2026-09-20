# Findings: asserted evidence beside observed evidence

**Status:** experimental evidence, not an accepted decision, requirement, or
schema. See the [charter](./2026-09-asserted-and-observed-evidence.md) and
GitHub issue [#43](https://github.com/ajamespgh/cortado/issues/43).

## What was tested

A disposable F# program placed one asserted framework/repository claim beside
compiler-observed direct-call and conditional-branch facts. A source-free
consumer returned observed call and branch evidence separately from the
asserted target claim. Each carried its own provenance form: tool and source
range for observations; external authority, reference, and optional citation
for the assertion.

An intentionally invalid script supplied the asserted target claim to a direct
call constructor. F# rejected it with `FS0001`, because
`ObservedCallEvidence` was required and `AssertedTargetClaim` was supplied.

## Observations

- Separate F# wrapper types make the asserted/observed substitution an
  immediate compile-time error in this narrow boundary.
- A consumer can present structural observed facts and relevant asserted
  context together without assigning confidence or describing the assertion as
  observed behavior.
- The assertion had an explicit external authority/reference and an optional
  citation; observed facts had language-tool provenance and precise source
  ranges. The experiment did not require those provenance forms to be forced
  into the same record.
- The output contained opaque IDs and generic statements only. It carried no
  raw source or developer-assigned symbol names.
- This experiment exposed no need for a universal graph abstraction, a storage
  model, API serialization, or confidence calculation.

## Assumptions affected

- **Strengthened:** asserted claims can remain visibly distinct from observed
  behavioral evidence while still contributing review context.
- **Strengthened:** F# can block one consequential category mix-up before it
  reaches a consumer.
- **Not tested:** derived or inferred evidence, multiple/conflicting external
  authorities, asserted evidence with a source citation, provenance chains,
  persistence, serialization, agent role projections, or real detector output.

## Recommendation and next step

Do not promote these types or the combined experimental object shapes. The
three completed spikes establish useful constraints, but they do not establish
the minimum durable vocabulary, identity semantics, citation contract, or
provenance model needed for a production boundary.

The next most useful experiment should exercise a real language-specific
extractor-to-F# hand-off with a deliberately tiny, explicit input projection.
It should use a TypeScript compiler extractor for observed facts plus one
separately supplied asserted claim, and show that the F# consumer has no source
or name access. It must still avoid storage, MCP serialization, and durable
schema choices. If it validates the same separations end to end, the accumulated
evidence may then be mature enough for an owner-reviewed vocabulary proposal.

## Artifact disposition

- Retain the charter, findings, F# program, and negative script as disposable
  experimental reference.
- Promote no code, schema, decision, or requirement.
