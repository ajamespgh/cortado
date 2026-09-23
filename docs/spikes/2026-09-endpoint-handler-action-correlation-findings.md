# Endpoint, middleware, handler, and action correlation findings

This records the disposable correlation spike for
[#53](https://github.com/ajamespgh/cortado/issues/53). It queries separately
retained observations from the endpoint, authorization-middleware, and
resource/action spikes. It does not create a graph model, a durable schema, or
a vulnerability finding.

## Fixed investigation query

`npm run spike:juice-shop-endpoint-handler-actions` examines only two pinned
Juice Shop operations:

- `GET /api/Cards`
- `DELETE /api/Cards/:id`

For each, it returns an object path with independently shaped observations:

1. the static Express registration;
2. a namespace-member handler-factory call in that registration and the
   matching exported handler declaration in `routes/payment.ts`;
3. direct receiver/member call observations inside that handler and any
   asserted-action-catalog matches; and
4. catalog-matched middleware evidence, or the separate
   `unresolved-guard-evidence` state.

Each source fact retains its citation and an immediate producer label. Guard
and action matches remain derived facts: their catalogs are separately
asserted and carry their stated authority/reference.

## Cited paths

All citations use snapshot
`1618a611b173b4bf114028e6e02549950606e29d`.

| Path component | Observed fact and citation | Correlation result |
| --- | --- | --- |
| Endpoint | `GET /api/Cards` is a static Express registration with an `appendUserId` participant and nested `payment.getPaymentMethods()` handler-factory call: `1618a611b173b4bf114028e6e02549950606e29d:server.ts#L458:C3-L458:C98`. | The handler-factory member and the `getPaymentMethods` declaration are a traceable syntactic connection. It does not establish wrapper or Express execution semantics. |
| Action | `getPaymentMethods` contains `CardModel.findAll(...)`: `1618a611b173b4bf114028e6e02549950606e29d:routes/payment.ts#L21:C25-L21:C82`. | The asserted action catalog labels the selected receiver/member pair `data-read`; the output calls this a derived catalog match, not a fact about a database read. |
| Guard evidence | The endpoint registration includes a selected catalog member: the `appendUserId` call within the same endpoint citation above. | The output state is `catalog-matched-middleware-evidence`, with the authorization-middleware spike as immediate producer. It is not a claim that the operation is authorized or protected. |
| Endpoint | `DELETE /api/Cards/:id` is a static Express registration with an `appendUserId` participant and nested `payment.delPaymentMethodById()` handler-factory call: `1618a611b173b4bf114028e6e02549950606e29d:server.ts#L460:C3-L460:C108`. | The handler-factory member and the `delPaymentMethodById` declaration are a traceable syntactic connection. |
| Action | `delPaymentMethodById` contains `CardModel.destroy(...)`: `1618a611b173b4bf114028e6e02549950606e29d:routes/payment.ts#L71:C24-L71:C100`. | The asserted action catalog labels this `data-delete`; that remains a derived review label, not proof of deletion. |
| Unresolved-state behavior | The regression fixture has an endpoint that resolves a handler and action but has no selected middleware-catalog member. | Its result is `unresolved-guard-evidence`, explicitly stating that no selected guard evidence was observed in the registration subset and that this is **not** an authorization-failure finding. |

The card model's selected initialization supplies separate resource context:
`1618a611b173b4bf114028e6e02549950606e29d:models/card.ts#L64:C5-L68:C4`.
That context does not turn either path into an access-control or sensitive-data
finding.

## Limitations

- The query recognizes only direct static `app.<verb>(path, ...)` registrations,
  selected static paths, namespace-member handler factory calls, and matching
  exported route functions. It does not resolve aliases, computed members,
  route builders, wrappers, factories beyond the observed nesting, or dynamic
  paths.
- The result is a fixed query response over separately shaped observations; it
  is not a node/edge substrate, universal graph, call graph, control-flow
  graph, framework execution model, or durable contract.
- An absent catalog match is a bounded absence of selected syntactic evidence.
  It cannot show that middleware is absent, an authorization check fails, or an
  operation is vulnerable.
- Action labels and middleware relevance remain asserted catalog context. The
  spike calculates no sensitivity, authorization, severity, confidence, impact,
  reachability, or vulnerability conclusion.
- The pinned corpus command has no side effects, but requires a caller-provided
  detached checkout; it was not available in this environment.

## Result

The experiment can answer the constrained investigation question with cited,
immediately attributed component facts while preserving unresolved guard
evidence as a non-failure state. The next safe step is owner review—not
promotion of this query result or its catalogs into a durable cross-representation
model.
