# Resource and action evidence in TypeScript handler findings

This records the disposable extraction spike for
[#52](https://github.com/ajamespgh/cortado/issues/52), using the pinned Juice
Shop corpus. It is experimental evidence, not a resource ontology, sensitivity
classification, detector, or statement about actual database/file effects.

## Method

`npm run spike:juice-shop-resource-actions` reads only these selected sources
from the caller-supplied pinned checkout described in [the corpus record](2026-09-juice-shop-analysis-corpus.md):

- `routes/payment.ts`
- `routes/fileUpload.ts`
- `models/card.ts`

It emits JSON to standard output and changes neither the corpus nor Cortado's
core. The extractor records representation-specific source facts: exported
handler declarations, import bindings, direct member-call syntax inside those
handlers, and direct `Model.init` calls with a static `tableName` option.

Its small action catalog is supplied separately. A catalog entry names a
receiver/member pair and an action label (for example `data-read`), together
with an authority and reference. Joining the catalog to an observed direct call
is derived review context. In particular, an operation name never itself makes
the action sensitive.

## Cited sample

All citations below refer to corpus snapshot
`1618a611b173b4bf114028e6e02549950606e29d`.

| Category | Fact | Citation | Limitation |
| --- | --- | --- | --- |
| Observed | `getPaymentMethods` contains a direct `CardModel.findAll(...)` member call. | `1618a611b173b4bf114028e6e02549950606e29d:routes/payment.ts#L21:C25-L21:C82` | This records a call expression and receiver spelling; it does not prove a database read, returned rows, or caller authorization. |
| Observed | The same handler contains a response member-call chain ending in `json`. | `1618a611b173b4bf114028e6e02549950606e29d:routes/payment.ts#L35:C5-L35:C72` | It is source syntax, not evidence that a response reaches a client. |
| Observed | `delPaymentMethodById` contains a direct `CardModel.destroy(...)` member call. | `1618a611b173b4bf114028e6e02549950606e29d:routes/payment.ts#L71:C24-L71:C100` | It does not establish deletion of any record, transaction outcome, or policy effect. |
| Observed | `extractZipBuffer` contains `fs.createWriteStream(...)` as an argument to a `pipeline(...)` call. | `1618a611b173b4bf114028e6e02549950606e29d:routes/fileUpload.ts#L34:C13-L34:C93` | The syntax does not prove file creation, write completion, resolved path, or whether this branch executes. |
| Observed | The selected card model has a `Card.init` call with static `tableName: 'Cards'`. | `1618a611b173b4bf114028e6e02549950606e29d:models/card.ts#L64:C5-L68:C4` | This is an ORM initialization shape, not proof of a database resource at runtime. |
| Asserted | The review catalog labels `CardModel.findAll` as `data-read`, `CardModel.destroy` as `data-delete`, `fs.createWriteStream` as `file-write`, and `res.json` as `response-emission`. | Issue #52 review catalog, with each entry's explicit authority/reference | These labels are policy context, not compiler-observed fact and not a sensitivity determination. |
| Derived | The selected handlers contain direct calls matching catalog entries. | Join of the preceding observed call facts and asserted catalog | The match does not prove completion, affected records/files, externally visible effect, or sensitivity. |

## Ambiguous and unsupported constructs

- The spike handles only syntactic direct property-access calls with an
  identifier receiver. Aliases, destructuring, computed members, optional calls,
  higher-order callbacks, factories, wrappers, and dynamic dispatch are not
  resolved.
- Nested call chains are represented as syntax paths. They do not supply a call
  graph, execution order, exception behavior, promise completion, or data flow.
- Import bindings are observed source facts, but import paths and names do not
  prove the API's behavior or resource type.
- `Model.init` with a static `tableName` is recorded only for the selected
  direct form. Dynamic options, model inheritance, associations, migrations,
  generated models, and ORM configuration are out of scope.
- The extractor does not identify individual records, request subjects, target
  paths, response payloads, external network destinations, or whether a call
  succeeds.
- No statement of sensitivity, severity, vulnerability, authorization,
  confidence, or impact follows from these observations.

## Result and next step

The spike shows that a consumer can receive reviewable, cited call/action
relationships without collapsing three separate claims: source-call syntax,
policy interpretation, and effect. The observed facts are sufficient to say
that a selected handler contains a direct member call; the asserted catalog may
say why that call deserves review; the derived match preserves both limits.

Do not promote this catalog or its labels into a durable resource or sensitive
action vocabulary. Owner review should decide whether the accumulated
observed/asserted/derived experiments justify a narrow vocabulary proposal.
