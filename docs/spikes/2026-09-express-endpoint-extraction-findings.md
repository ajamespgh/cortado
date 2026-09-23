# Express endpoint and middleware registration findings

This records the disposable extraction spike for
[#49](https://github.com/ajamespgh/cortado/issues/49), using the corpus defined
in [the Juice Shop corpus record](2026-09-juice-shop-analysis-corpus.md).

## Result

`npm run spike:juice-shop-endpoints` reads the pinned, caller-supplied corpus
root from `CORTADO_JUICE_SHOP_ROOT` and parses `server.ts` with the TypeScript
AST. It emits JSON only to standard output; it neither changes the corpus nor
transfers data to the F# core.

For the selected paths, the pinned corpus produced nine registration
observations across `POST`, `USE`, `GET`, `PUT`, and `DELETE`:

- `/file-upload`
- `/profile/image/file`
- `/rest/memories`
- `/rest/basket`
- `/api/Users/:id`
- `/rest/user/login`

Every registration has a snapshot/project-relative source citation, a citation
for its static path, and ordered participant citations. Participants retain
only their syntactic form (`identifier`, `property-access`, `call-expression`,
or `inline-callback`) in this spike output. In particular, a call expression
is not treated as an authorization decision or as a resolved handler.

The extractor recognizes direct `app.use` and verb registrations, static string
or string-array paths, inline callbacks, and `app.route(path).verb(...)`
chains. A route-builder chain is represented as a route registration, not a
direct function call. Its chained verbs are ordered by their source/execution
shape rather than AST nesting order.

## Explicit limitations

- There is no framework execution model: registration ordering is observed
  source order, not an assertion of Express's complete effective routing
  behavior.
- Imported/member handlers, factory results, and wrappers such as
  `utils.asyncHandler(...)` remain syntactic participants. The spike does not
  resolve their targets or infer their purpose.
- A non-static path is reported as unsupported. A multi-argument `app.use`
  with a non-static first argument is reported as `ambiguous-use-scope`, rather
  than guessing whether it is global middleware or a dynamic path registration.
- Computed calls such as `app[method](...)`, nonstandard routers, aliasing of
  `app`, conditional registration, spread participants, nested application
  instances, and framework extensions are not interpreted.
- No authorization, vulnerability, confidence, durable identity, cross-file
  resolution, or core-model transfer follows from these observations.

## Validation

The regression test uses a small TypeScript source fixture to assert static
route and path capture, participant ordering and citations, `app.route` chain
handling, exclusion of `app.get('view engine')`, and reporting of computed or
ambiguous forms. The pinned corpus run confirms the selected real registrations
are extractable without an upstream dependency install.
