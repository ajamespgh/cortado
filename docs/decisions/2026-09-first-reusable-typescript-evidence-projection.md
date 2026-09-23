# Decision: first reusable TypeScript evidence projection

**Status:** accepted 2026-09-23.

**Decision record:** [#56](https://github.com/ajamespgh/cortado/issues/56).

## Decision

The first reusable TypeScript projection is a TypeScript-local, in-memory
evidence envelope for primitive, representation-specific observations. It is
an implementation boundary for TypeScript extractors and their local
consumers; it is not a new durable core-model type or an access-control model.

Each projected primitive observation must preserve the applicable accepted
evidence-vocabulary invariants:

- its evidence basis is explicit: observed, asserted, or derived;
- source-backed observations have an immutable snapshot, a project-relative
  citation resource, and a validated source range;
- observed evidence identifies its immediate producer; asserted context
  identifies its authority and reference; and
- limitations, unresolved correlations, and unsupported source forms are
  explicit rather than silently inferred.

The envelope carries representation-specific payloads. Route registration,
direct-call, control-flow, handler-reference, middleware/guard, and action
observations retain their own semantics. It does not require a universal fact,
node/edge, or graph representation.

The endpoint-to-handler-to-action result from the Juice Shop spikes remains an
extractor-local query over those observations. Its ordered path shape,
resolution and guard-status vocabulary, Express recognition rules, and
Juice-Shop-selected catalogs are not part of the reusable projection.

## Rationale

The access-control spikes established that citations, immediate producer
provenance, separation of observed/asserted/derived material, and explicit
unresolved or unsupported outcomes remain useful while correlating separately
extracted facts. The derived regression corpus covers guard evidence, no
recognized guard evidence, wrapper/indirection ambiguity, and computed
registration unsupported cases.

Those same primitives are the controlled subject of the adjacent-signal
comparison in [#57](https://github.com/ajamespgh/cortado/issues/57). Selecting
only the envelope lets that work test reuse across signal families without
assuming that the current access-control query, framework rules, or catalogs
generalize.

## Limits and deferred decisions

- A catalog match is bounded derived evidence; it does not establish effective
  authorization, reachability, a database effect, sensitivity, or a
  vulnerability.
- Absent selected guard evidence is not an authorization-failure finding.
- The projection does not model framework execution, route precedence,
  wrappers, aliases, dynamic dispatch, data flow, or runtime configuration.
- This decision adds no F# core types. A durable extension needs evidence from
  another signal family and a later decision on the still-deferred identity,
  provenance, and vocabulary details.
- This decision selects no JSON, MCP/API, storage, confidence, detector-label,
  raw-source-access, or production-runtime contract.

## Consequences

Future TypeScript extractor work may share this envelope and test its reuse in
the constrained comparison in [#57](https://github.com/ajamespgh/cortado/issues/57).
It must keep framework-specific extraction, asserted catalogs, and
purpose-specific correlation queries outside that boundary. Any proposal to
promote a projection into the F# core must separately show why it is
language-neutral and resolve the deferred decisions above.
