# Authorization-relevant middleware and handler-guard findings

This records the disposable extraction spike for
[#51](https://github.com/ajamespgh/cortado/issues/51), using the pinned Juice
Shop corpus. It is experimental evidence, not an authorization ontology,
detector, confidence model, or claim that a cited endpoint is effectively
protected.

## Method

`npm run spike:juice-shop-authorization-middleware` reads the caller-supplied,
pinned checkout described in [the Juice Shop corpus record](2026-09-juice-shop-analysis-corpus.md).
It produces JSON on standard output only; it does not modify the corpus or
transfer facts to the F# core.

The spike has three deliberately separate inputs/outputs:

- **Observed:** TypeScript syntax establishes namespace imports, static Express
  registrations and their ordered participants, selected namespace-member call
  expressions, and the exported helper's local syntactic shape.
- **Asserted:** the script's small review catalog lists the members selected by
  issue #51. Its authority is explicitly `Issue #51 review catalog`; member
  selection is not a source-derived security conclusion.
- **Derived:** a catalog member appears as an observed participant of an
  observed registration. This is a join for review, not proof of effective
  authentication, authorization, reachability, or resource protection.

The extractor first observes namespace imports, so it does not assume that a
local binding named `security` has a particular meaning. It only joins calls
from the asserted catalog's module specifier to registration participants.

## Cited sample

All citations below use the corpus convention and refer to
`1618a611b173b4bf114028e6e02549950606e29d`.

| Category | Fact | Citation | Limitation |
| --- | --- | --- | --- |
| Observed | A static `USE` registration for `/rest/basket` has two ordered call-expression participants. | `1618a611b173b4bf114028e6e02549950606e29d:server.ts#L375:C3-L375:C76` | This is source registration shape, not an Express execution model. |
| Observed | The first and second participants are namespace-member call expressions at the respective source ranges. | `1618a611b173b4bf114028e6e02549950606e29d:server.ts#L375:C27-L375:C50`; `1618a611b173b4bf114028e6e02549950606e29d:server.ts#L375:C52-L375:C75` | The call spelling and its order say nothing by themselves about the member's purpose. |
| Asserted | `isAuthorized`, `isAccounting`, `denyAll`, `appendUserId`, and `updateAuthenticatedUsers` are the review catalog for this spike. | Issue #51 scope, not a source citation | This is an externally supplied selection criterion, not observed authorization evidence. |
| Derived | The first basket participant is a catalog member registered at the basket path. | Join of the preceding observed registration/call and asserted catalog | It does not establish that the route is protected or that the helper permits or denies any request. |
| Observed | The `isAuthorized` export is an arrow-function initializer whose expression directly calls another expression. | `1618a611b173b4bf114028e6e02549950606e29d:lib/insecurity.ts#L52:C1-L52:C77` | The extractor records syntactic form only; it does not assign an authorization role based on a helper name, import path, or comments. |
| Observed | The `isAccounting` export contains a conditional and distinct nested call expressions in its returned callback. | `1618a611b173b4bf114028e6e02549950606e29d:lib/insecurity.ts#L154:C1-L163:C2` | This is evidence of local control-flow syntax, not a complete proof of all runtime outcomes. |
| Observed | `appendUserId` contains a returned callback with a `try`/`catch` and nested calls. | `1618a611b173b4bf114028e6e02549950606e29d:lib/insecurity.ts#L178:C1-L187:C2` | The presence of user-context manipulation neither proves nor disproves an authorization decision. |

The source comments surrounding the registration and the `./lib/insecurity`
module specifier were deliberately excluded from the observed authorization
claim. They may help a human select an asserted review catalog, but they must
remain labeled asserted context.

## Result

The sample demonstrates a useful narrow distinction:

1. The extractor can preserve concrete registration and helper-shape facts
   with corpus citations.
2. A reviewer can attach a small externally authorized catalog without
   promoting names, paths, or comments into behavioral evidence.
3. A consumer can receive the derived join and its limitation as review context
   while retaining the fact that it is not a protection finding.

This is sufficient for a future evidence gatherer to report
"catalog-selected middleware is registered here" with the supporting facts and
limitations. It is insufficient to report "this endpoint requires a role," or
to classify a middleware function as authorization-relevant without an
explicitly defined evidence rule and broader control-flow/framework analysis.

## Limitations and follow-up

- The existing Express spike supports only static paths and its documented
  direct registration/route-builder subset. Aliasing, wrappers, dynamic
  registration, nonstandard routers, and complete Express ordering semantics
  remain outside this result.
- Helper shape is local TypeScript syntax only. The spike does not resolve
  external library behavior, configuration, token validation semantics,
  exceptions, middleware completion, or interprocedural control flow.
- The review catalog is intentionally hard-coded and disposable. It is not a
  durable framework catalog, an authority/provenance schema, or a policy
  mechanism.
- No confidence, vulnerability, protected-resource, role, authentication, or
  authorization classification is calculated.
- No core-model hand-off, persistence, serialization, MCP/API, or visualization
  contract is created.

The next safe step is owner review of whether this observed/asserted/derived
separation is adequate before proposing any durable authorization-related
vocabulary or detector behavior.
