# Adjacent signal-family comparison

This records the prioritization research for
[#57](https://github.com/ajamespgh/cortado/issues/57). It selects two adjacent
signal families for later, separately chartered experimentation. It does not
implement a detector, classify a vulnerability, or extend the durable core.

## Candidates selected

The comparison selects **unsafe file handling** and **unvalidated redirects**.
They are useful complements to the access-control work: each starts at an
externally reachable operation, needs evidence about a request-derived value,
and ends at a semantically different operation. File handling has a concrete
existing source anchor: the resource/action spike observed
`fs.createWriteStream(...)` syntax in the selected Juice Shop upload handler.
Redirects provide a distinct sink and validation question without presuming
that the current Express or Juice Shop forms are representative.

No claim follows about the behavior or security of any Juice Shop location.

## What remains shared

Both families can reuse the TypeScript-local evidence envelope selected in
[the first reusable TypeScript evidence-projection decision](../decisions/2026-09-first-reusable-typescript-evidence-projection.md):

- immutable snapshot, project-relative citation, and source range;
- immediate producer for observed facts and authority/reference for asserted
  context;
- explicit observed, asserted, and derived evidence basis;
- representation-specific payloads rather than a universal graph; and
- explicit unresolved, ambiguous, and unsupported outcomes.

Existing route registration, handler-reference, direct-call, and selected
action observations may supply cited starting context. They do not by
themselves show that a request value reaches a sink or that a check validates
that value.

## Required additional evidence

| Family | Additional observed or derived evidence | Optional asserted context | Required limits |
| --- | --- | --- | --- |
| Unsafe file handling | A representation-specific request-input occurrence; a file-path, filename, archive-entry, or buffer expression; a file-operation sink and its relevant argument; and an explicit bounded relation between the selected input expression and selected sink argument. Path-normalization, containment, extension, archive, and overwrite checks must remain independently cited observations rather than a boolean `safe` result. | A review catalog may identify selected APIs as file-operation sinks or selected calls as path-validation candidates. | The result cannot establish filesystem effects, actual resolved paths, traversal, overwrite, archive extraction behavior, execution order, error handling, or exploitability. Aliases, wrappers, dynamic paths, and unmodeled data flow must be unresolved or unsupported. |
| Unvalidated redirects | A representation-specific request-input occurrence; a redirect/response sink and its target argument; and an explicit bounded relation between the selected input expression and that target. URL parsing, origin/host allowlist, relative-path, encoding, and branch checks must remain independently cited observations. | A review catalog may identify selected response APIs as redirect sinks or selected validation APIs/patterns as review context. | The result cannot establish browser navigation, target resolution, host equivalence, encoding semantics, route execution, validation effectiveness, or an open-redirect finding. Wrappers, aliases, computed property access, and unresolved flow must be explicit. |

The proposed input-to-argument relation is a new **TypeScript
representation-specific data-flow observation or bounded derived relation**.
It must identify its source facts and preserve their citations and evidence
basis. It is not permission to infer a framework execution model or create a
generic taint graph.

## Comparison outcome

The shared envelope is sufficient as a local container for both families. The
new common need is not a security label; it is a bounded, cited relationship
between a request-derived expression and a selected argument position, plus
separate observations for candidate validation context.

That need does **not** force a durable-core change now. It has not yet been
tested in either family, its identity and provenance behavior across a longer
flow is unexamined, and the current durable F# slice intentionally covers only
direct-call and conditional-branch observations. A later decision would be
needed before promoting a data-flow representation or relationship into the
core.

## Next experiments

Run no more than one small, read-only TypeScript extraction spike per selected
family. Each should use a pinned, attributable corpus or derived fixture and
assert all of the following:

1. cited input, sink, and any validation-context observations;
2. a bounded relation only for directly supported flow shapes;
3. an explicit unresolved/unsupported result for at least one wrapper,
   alias, computed, or dynamic shape; and
4. no vulnerability, effective-validation, or runtime-behavior verdict.

Only after both experiments can an owner review whether the shared
input-to-argument relation is genuinely language-neutral enough to justify a
durable core proposal.
