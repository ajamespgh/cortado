# Findings: identity and provenance across analysis representations

**Status:** experimental evidence, not an accepted decision, requirement, or
schema. See the [charter](./2026-09-identity-and-provenance-boundary.md) and
GitHub issue [#41](https://github.com/ajamespgh/cortado/issues/41).

## What was tested

A disposable TypeScript compiler-API extractor analyzed a tiny fixture with two
functions, a conditional branch, and a direct call. It emitted two deliberately
separate representations:

- a direct-call fact with observed call evidence; and
- a conditional-branch fact with observed control-flow evidence.

The two facts referred to one opaque, snapshot-scoped experimental function
identity. A source-free consumer queried for a function that both had a
conditional branch and called a selected opaque target. Its result retained the
distinct call and control-flow evidence records, including their citations and
producer details.

## Observations

- One opaque identity was enough to correlate the two representations in this
  same-snapshot, direct-call case. The output retained separate `callFacts` and
  `branchFacts`; no generic node/edge representation was needed.
- Each returned evidence item needed a link to its subject, evidence category,
  producer tool/version, and source citation. The query itself only required
  the identity links, but a human-reviewable result required the evidence
  records as well.
- The call and its enclosing branch began on the same source line in this
  fixture. A line-only citation would not distinguish them; their complete
  source ranges, including columns here, did. This is evidence to investigate
  citation precision further, not a final citation-schema decision.
- Both compiler-reported facts could honestly be marked `observed` in this
  narrow experiment. No confidence or reliability semantics were necessary.
- TypeScript syntax and the fixture's developer-assigned function names stayed
  inside the extractor. The consumer received neither raw source nor names.
- The direct link from each semantic fact to its supporting evidence prevented
  provenance from being lost while correlating across representations.

## Assumptions affected

- **Strengthened:** snapshot-scoped opaque identity can support useful joins
  across distinct representations without collapsing their semantics.
- **Strengthened:** a consumer can preserve representation-specific evidence
  during a cross-representation query rather than returning an unexplained
  correlation.
- **Disproved for this slice:** source line alone necessarily distinguishes
  nearby observations. A full range matters.
- **Not tested:** identity across files, aliases, methods, overloaded or
  dynamic calls, multiple branches, cross-snapshot correlation, snapshot
  integrity, producer ownership versus per-item provenance, inferred/asserted
  evidence, storage, MCP exposure, or F# boundary types.

## Recommendation and next step

Do not promote this object shape. Two direct compiler observations in one file
are insufficient evidence for a durable identity, provenance, or citation
schema.

The next useful work is an enabling decision-free task to make a local F# tool
chain available, followed by a small F# boundary spike that encodes only the
invalid combinations exposed here (for example, distinct call and control-flow
facts with evidence links). That spike should test whether F# makes accidental
semantic collapse harder without selecting production modules or schemas.

## Artifact disposition

- Retain this charter and findings as experimental reference.
- Retain `spikes/identity-provenance-boundary/` as disposable runnable
  reference only.
- Promote no code, schema, requirement, or decision.
