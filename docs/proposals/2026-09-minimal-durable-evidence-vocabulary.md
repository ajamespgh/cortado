# Proposal: minimum durable evidence vocabulary

**Status:** accepted 2026-09-20; superseded as the review artifact by the
[accepted decision](../decisions/2026-09-minimum-durable-evidence-vocabulary.md).

**Related issue:** [#45](https://github.com/ajamespgh/cortado/issues/45).

## Decision requested

Approve the following language-neutral conceptual vocabulary as the smallest
durable boundary for the first Cortado core-model work. This approves concepts
and invariants only. It does not approve field names, types, JSON, databases,
MCP/API shapes, or a production TypeScript-to-F# runtime boundary.

## Proposed vocabulary and invariants

### Analysis snapshot

Every emitted fact and citation belongs to one immutable analysis snapshot.
The snapshot establishes the scope in which identities correlate. This proposal
makes no claim about persistence, integrity metadata, deletion, or
cross-snapshot comparison.

### Opaque subject identity

A fact may identify its subject, and a semantic relationship may identify its
participants, using opaque identities scoped to the snapshot. Consumers can
use those identities to correlate facts from different analysis
representations. Identities do not expose developer-assigned names or source
syntax by default.

This proposal does not choose identity generation, stability across scans,
cross-snapshot correlation, or an externally serialized ID format.

### Evidence category

Every evidence item is exactly one of: observed, derived, inferred, or
asserted.

- **Observed** evidence reports a fact directly established by authoritative
  tooling or source analysis.
- **Derived** evidence is deterministically calculated from other evidence.
- **Inferred** evidence depends on assumptions or interpretive,
  probabilistic, or non-deterministic processing.
- **Asserted** evidence is supplied by a human, configuration, framework
  knowledge source, or other external authority.

Categories must remain explicit across core-model construction and consumer
projections. An asserted claim must not silently become observed behavioral
evidence. This proposal assigns no confidence, reliability, authority-ranking,
or propagation semantics to any category.

### Representation-specific facts and relationships

Facts and relationships retain the semantics of the analysis representation
that produced them. For example, a direct-call observation and a
conditional-branch observation remain distinct kinds, even when opaque
identity correlates them. The core must not require a universal node-and-edge
graph representation.

A relationship that a consumer must query semantically—for example, a resolved
direct call—must be explicit evidence or a representation-specific fact. A
source location alone is not a substitute for that semantic relationship.

### Citation

Observed source-backed evidence carries a human-reviewable citation containing
the project-relative resource path, source range, and analysis-snapshot
identity. A range must be capable of distinguishing nearby observations; this
proposal does not prescribe coordinate encoding or require every future
evidence category to use a source citation.

### Immediate provenance

Observed evidence records its immediate producer sufficiently to identify the
responsible analyzer/tool and version or equivalent build identity. Asserted
evidence identifies its supplying authority and reference. These are immediate
provenance requirements only; full provenance chains and authority resolution
remain open.

### Information isolation

Language-specific extractors may use raw source, syntax, and developer names
internally. The core-model boundary and ordinary agent-facing projections do
not receive those values by default. Citations locate evidence for human
review but do not grant filesystem access.

## Rationale and supporting experiments

Four disposable spikes established the minimum evidence behind this proposal:

1. [Minimal shared evidence vocabulary](../spikes/2026-09-minimal-shared-evidence-vocabulary-findings.md)
   demonstrated opaque identity, observed evidence, citation, immediate
   provenance, and explicit direct-call semantics without source or names at
   the consumer.
2. [Identity and provenance across representations](../spikes/2026-09-identity-and-provenance-boundary-findings.md)
   demonstrated same-snapshot correlation of separate call and branch facts
   while preserving their separate semantics.
3. [Asserted beside observed evidence](../spikes/2026-09-asserted-and-observed-evidence-findings.md)
   demonstrated that F# types can prevent an asserted claim from substituting
   for observed call evidence.
4. [TypeScript-to-F# evidence hand-off](../spikes/2026-09-typescript-to-fsharp-evidence-handoff-findings.md)
   demonstrated the separation end to end from a real TypeScript compiler-API
   extractor to an isolated F# consumer.

## Explicitly deferred

This proposal does not decide or authorize:

- concrete domain types, field names, constructors, modules, or package layout;
- JSON, file, MCP/API, visualization, detector, ML, or storage schemas;
- snapshot persistence, integrity, retention, or deletion behavior;
- opaque-ID generation, collision handling, external display, or
  cross-snapshot semantics;
- transitive provenance, authority ranking, citations for all categories, or
  conflicting assertions;
- confidence, reliability, severity, impact, exploitability, or inference
  propagation;
- a universal graph abstraction, language/framework extension mechanism, or
  production process/runtime boundary; or
- expanded access to raw source or developer-assigned names.

## Consequences if accepted

The next implementation work may define an F# core-model slice and regression
tests that enforce these invariants. Any concrete wire/storage schema or
unresolved concept above requires a separate proposal or decision before it is
made durable.

## Owner review prompts

1. Is this vocabulary sufficiently small and language-neutral for the core
   boundary?
2. Should an asserted claim always require an authority and reference, as
   proposed, or is a different minimum needed?
3. Is the citation rule scoped correctly to observed source-backed evidence?
4. Are any deferred concepts required before the first core-model slice can
   safely begin?
