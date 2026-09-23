# TypeScript direct-call adapter findings

The #50 spike uses a one-shot in-memory process stream, not a durable boundary.
Node constructs the pinned Juice Shop TypeScript program and resolves direct
identifier calls in `server.ts`, `routes/fileUpload.ts`, and `routes/chat.ts`.
It sends only opaque tokens, project-relative citation coordinates, the pinned
snapshot, and TypeScript build provenance to a disposable F# executable.

The F# adapter immediately maps each record to a real
`Cortado.Core.DirectCallObservation`. It also verifies the core rejects a
callee constructed with another snapshot. No source text, AST, developer name,
JSON document, file, database, service, or public API is produced.

The tab-separated stream is intentionally private to this spike invocation and
is not a proposed schema. A future distributed gatherer boundary needs its own
reviewed transport, identity, authentication, and compatibility decisions.
