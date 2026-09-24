# Decision: bounded flow evidence remains TypeScript-local

**Status:** accepted 2026-09-23.

**Decision record:** [#61](https://github.com/ajamespgh/cortado/issues/61).

## Decision

Do not promote the bounded request-input-to-selected-argument relations from
the file-operation and redirect-target spikes into a durable core
representation. They remain TypeScript-local, in-memory evidence projections
and extractor-local correlation results.

The accepted reusable TypeScript evidence envelope continues to apply to their
primitive observations: explicit evidence basis, immutable snapshot,
project-relative citation, validated source range, immediate producer or
assertion authority/reference, and explicit limitations. The two relation
shapes retain their distinct payloads and names:

- request input to `fs.createWriteStream` argument zero; and
- request input to `res.redirect` target argument zero.

## Evidence considered

[#59](https://github.com/ajamespgh/cortado/issues/59) and
[#60](https://github.com/ajamespgh/cortado/issues/60) each demonstrate a
reviewable relation only when the same selected request-property expression is
written directly in the selected argument position. Both preserve citations,
immediate producer attribution, evidence basis, and explicitly unresolved
alias forms. Both also retain path-normalization or URL-parsing syntax as
independent context rather than validation conclusions.

## Rationale

The shared envelope invariants held, but the experiments did not establish a
durable, language-neutral data-flow concept. Their support is limited to a
narrow TypeScript AST form; each has distinct source, framework/API, sink, and
validation-context semantics; and neither exercises identity or provenance
through a longer flow. A common durable relation would therefore prematurely
imply more general data-flow, validation, or cross-language support than the
evidence warrants.

## Consequences

- The two extractors remain separate and may evolve only within their stated
  TypeScript-local limits.
- No durable F# core type, generic taint graph, JSON/MCP/API schema,
  persistence format, confidence model, detector contract, or finding is
  created by this decision.
- Every future projection must keep unsupported aliases, wrappers, computed
  access, and dynamic forms explicit, and must not turn path or URL context
  into an effective-validation verdict.
- A later promotion proposal needs evidence from additional representations or
  languages and a separate decision resolving snapshot-scoped identity,
  longer-flow provenance, citation behavior, and information-isolation tests.
