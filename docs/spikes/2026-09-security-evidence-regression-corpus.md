# TypeScript security-evidence regression corpus

This records the bounded regression corpus created for
[#55](https://github.com/ajamespgh/cortado/issues/55). It contains minimal,
derived TypeScript fixtures, not a copied Juice Shop source snapshot and not a
vulnerability corpus.

## Provenance and handling

The corpus is at
[`fixtures/security-evidence/juice-shop-derived-v1`](../../fixtures/security-evidence/juice-shop-derived-v1).
Its [`corpus.json`](../../fixtures/security-evidence/juice-shop-derived-v1/corpus.json)
pins the upstream source to OWASP Juice Shop revision
`1618a611b173b4bf114028e6e02549950606e29d`, records its MIT license and
attribution, and gives the derived fixture its own identity:
`security-evidence-juice-shop-derived-v1`.

Regression tests parse every input read-only and assert that SHA-256 hashes are
unchanged. Fixture citations therefore identify the derived fixture snapshot;
they do not pretend to be citations into the upstream checkout.

## Covered states

| State | Fixture behavior asserted | Limitation asserted |
| --- | --- | --- |
| Guard evidence | A direct registration includes catalog-selected `isAuthorized` and resolves a directly registered namespace handler. | The catalog match does not establish effective authorization. |
| No recognized guard evidence | A direct delivery registration resolves its handler and selected direct-call action evidence. | The unresolved guard result is not an authorization-failure finding. |
| Wrapper/indirection ambiguity | A composed guard/handler is passed through an identifier registration participant. | The fixed direct-registration subset leaves the handler and guard evidence unresolved. |
| Unsupported dynamic/framework construct | A computed `app[method]` registration is presented. | Extraction reports `computed-app-member`; it does not infer an endpoint. |

The tests assert observations, citation identity, asserted catalog separation,
and explicit limits. They make no blanket vulnerability, sensitivity, or
authorization verdict. The corpus does not broaden the extractor into a
framework execution model, alias analysis, wrapper resolution, or dynamic
dispatch support.
