# Bounded TypeScript request-to-file-operation evidence

This records the experimental result for [#59](https://github.com/ajamespgh/cortado/issues/59). It is a TypeScript-local, read-only extraction spike. It does not detect a vulnerability or classify a path as safe or unsafe.

## Method

The extractor reads the attributable derived fixture at
`fixtures/security-evidence/file-operation-derived-v1` without writing it. The
fixture retains the Juice Shop revision, license, attribution, and the prior
`routes/fileUpload.ts` `fs.createWriteStream(...)` source anchor from the
resource/action spike. It records three distinct categories:

- observed request-property occurrences in the narrow `req.body|params|query.<name>` form;
- observed `fs.createWriteStream` argument-zero syntax and separately observed `path.normalize` context; and
- a derived relation only when that same request-property expression is written directly as the selected sink argument.

The fixture also records an aliased request value passed to the same sink. The extractor returns that as unresolved rather than following the local variable.

## Result

The direct case preserves snapshot-scoped citations and immediate producer
attribution for both sides of the relation. The normalization call remains a
separate observation. It does not change the relation into a validation verdict.

## Limits

- The result does not model aliases, wrappers, computed access, dynamic forms, or general data flow.
- It does not establish a filesystem effect, resolved path, containment, traversal, overwrite, archive behavior, execution order, or error handling.
- A `path.normalize` observation does not establish that its result is used or that validation is effective.
- No vulnerability, severity, confidence, or safe/unsafe result follows.

The evidence remains inside the TypeScript-local envelope accepted in [the first reusable TypeScript evidence-projection decision](../decisions/2026-09-first-reusable-typescript-evidence-projection.md). It is not a durable-core or generic taint-graph proposal.
