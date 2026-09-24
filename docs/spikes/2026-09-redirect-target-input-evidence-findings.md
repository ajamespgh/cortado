# Bounded TypeScript request-to-redirect-target evidence

This records the experimental result for [#60](https://github.com/ajamespgh/cortado/issues/60). It is a TypeScript-local, read-only extraction spike. It does not report an open redirect or classify validation as effective or ineffective.

## Method

The extractor reads the Cortado-authored, attributable fixture at
`fixtures/security-evidence/redirect-target-derived-v1` without writing it. It
records three distinct categories:

- observed request-property occurrences in the narrow `req.body|params|query.<name>` form;
- observed `res.redirect` argument-zero syntax and separately observed `new URL(...)` context; and
- a derived relation only when the same request-property expression is written directly as the selected redirect target argument.

The fixture also passes an aliased request value to `res.redirect`. The extractor returns it as unresolved rather than following the local variable.

## Result

The direct case preserves snapshot-scoped citations and immediate producer
attribution for both sides of the relation. The URL-construction call remains a
separate observation and does not produce a validation verdict.

## Limits

- The result does not model aliases, wrappers, computed access, dynamic forms, or general data flow.
- It does not establish browser navigation, target resolution, host equivalence, encoding semantics, route execution, or response delivery.
- A `new URL(...)` observation does not establish that its result is used, an allowed origin/host, relative-target behavior, or effective validation.
- No open-redirect, vulnerability, severity, confidence, or safe/unsafe result follows.

The evidence remains inside the TypeScript-local envelope accepted in [the first reusable TypeScript evidence-projection decision](../decisions/2026-09-first-reusable-typescript-evidence-projection.md). It is not a durable-core or generic taint-graph proposal.
