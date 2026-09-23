# Juice Shop access-control candidate evidence-quality findings

This records the bounded evidence-quality investigation for
[#54](https://github.com/ajamespgh/cortado/issues/54). It evaluates three
representative paths from the pinned Juice Shop corpus. It is not a
vulnerability report, a protection classification, or a claim about runtime
authorization behavior.

## Method

`npm run spike:juice-shop-access-control-candidates` runs a fixed query over
the read-only, pinned checkout described in
[the Juice Shop corpus record](2026-09-juice-shop-analysis-corpus.md). The
query retains the existing separation between observed source facts, asserted
review-catalog context, and derived catalog matches. It selected:

- `isAuthorized` and `appendUserId` from `./lib/insecurity` as asserted
  guard-catalog members; and
- `DeliveryModel.findAll`, `CardModel.findAll`, and `res.json` as asserted
  action-catalog entries.

The categories say only what the fixed source query supports:

- **demonstrated guard evidence**: an asserted catalog member occurs in the
  observed endpoint registration;
- **reviewable candidate**: the endpoint and handler/action path resolve, but
  no selected guard-catalog member occurs in that registration; and
- **unsupported/ambiguous**: the source subset contains context that could be
  relevant, but the available evidence cannot turn it into an authorization
  conclusion.

All citations below use snapshot
`1618a611b173b4bf114028e6e02549950606e29d`.

## Candidate records

| Path | Observed facts | Asserted context | Gaps | Outcome |
| --- | --- | --- | --- | --- |
| `GET /rest/2fa/status` | The direct registration has `security.isAuthorized()` before a reference to `twoFactorAuth.status`: `server.ts#L482:C3-L482:C97`. The direct handler reference resolves to the exported `status` declaration: `routes/2fa.ts#L58:C1-L86:C2`. That handler has direct response-call syntax: `routes/2fa.ts#L69:C7-L77:C9` and `routes/2fa.ts#L79:C7-L81:C9`. | The issue #54 catalog selects `isAuthorized` as guard context; its registration match is derived from the observed call at `server.ts#L482:C31-L482:C54`. | The query does not model Express ordering, `expressJwt` behavior, token configuration, exceptions, reachability, or completed responses. | **Demonstrated guard evidence**: selected catalog evidence is registered on this path. It does not demonstrate effective authorization or that the resource is protected. |
| `GET /api/Deliverys` | The direct registration calls `delivery.getDeliveryMethods()`: `server.ts#L472:C3-L472:C79`, resolving to `routes/delivery.ts#L11:C1-L30:C2`. The handler contains `DeliveryModel.findAll(...)` syntax: `routes/delivery.ts#L13:C27-L13:C50`, and response-call syntax at `routes/delivery.ts#L25:C7-L25:C69`. | The issue #54 action catalog labels the selected `findAll` spelling `data-read`. No selected guard-catalog member appears in this registration. | The bounded absence does not account for global middleware, router composition, wrappers, runtime configuration, request flow, or handler-local checks. The action label does not establish a database effect or sensitive data. | **Reviewable candidate**: the endpoint-to-handler/action path is reviewable and its selected guard evidence is unresolved. This is not an authorization-failure or vulnerability finding. |
| `GET /api/Cards` | The direct registration has `security.appendUserId()` before `payment.getPaymentMethods()`: `server.ts#L458:C3-L458:C98`. The handler resolves to `routes/payment.ts#L18:C1-L37:C2` and contains `CardModel.findAll(...)`: `routes/payment.ts#L21:C25-L21:C82`. The observed helper shape includes a returned callback, `try`/`catch`, assignment from `authenticatedUsers.tokenMap`, and a `401` catch response: `lib/insecurity.ts#L178:C1-L187:C2`. | The issue #54 catalog selects `appendUserId`, producing a registration match at `server.ts#L458:C25-L458:C48`. The action catalog labels the selected `findAll` spelling `data-read`. | Neither catalog selection nor the helper's local syntax proves authentication, authorization, record ownership, runtime failure behavior, or Express completion/order. The query has no data-flow or framework semantics. | **Unsupported/ambiguous**: the path has cited context worth human review, but the available evidence cannot classify it as protected or unprotected. |

## Result and limits

The three records distinguish a registered catalog-selected guard from a path
with no selected registration match, while leaving the user-context helper as
an explicit ambiguous case. This is enough for a human to review the cited
paths without collapsing source syntax, catalog policy, and runtime security
claims.

The correlation spike was extended only to recognize a directly registered
namespace handler reference (such as `twoFactorAuth.status`) in addition to a
namespace handler-factory call. It still does not create a graph model or
broaden the extractor to aliases, computed properties, dynamic registrations,
or framework semantics.

No result above reports a Juice Shop defect. A future owner decision would be
needed before proposing durable access-control vocabulary, confidence rules, or
detector behavior.
