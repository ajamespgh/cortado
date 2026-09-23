# Juice Shop TypeScript analysis corpus

This document records the read-only corpus used by the TypeScript security
evidence spikes in [#48](https://github.com/ajamespgh/cortado/issues/48).
It is a reproducible experiment input, not a Cortado fixture and not a claim
that any location in the corpus is vulnerable.

## Pinned source

- Repository: [`juice-shop/juice-shop`](https://github.com/juice-shop/juice-shop)
- Revision: [`1618a611b173b4bf114028e6e02549950606e29d`](https://github.com/juice-shop/juice-shop/tree/1618a611b173b4bf114028e6e02549950606e29d)
- License: MIT, as declared by that revision's
  [`package.json`](https://github.com/juice-shop/juice-shop/blob/1618a611b173b4bf114028e6e02549950606e29d/package.json)
- Attribution: OWASP Juice Shop and its contributors; retain the upstream
  repository URL, revision, and license notice with any future derived corpus
  material.

Cortado does not vendor the upstream repository. A user obtains a detached,
read-only checkout at the pinned revision. Do not run `npm install` in that
checkout: the upstream package's install lifecycle can build generated output,
which is unnecessary for compiler-program construction and would change the
corpus working tree.

## Reproduction and smoke test

Clone and detach at the pinned revision outside this repository:

```bash
git clone https://github.com/juice-shop/juice-shop.git /path/to/juice-shop
git -C /path/to/juice-shop checkout --detach 1618a611b173b4bf114028e6e02549950606e29d
git -C /path/to/juice-shop status --short
```

The last command must produce no output. With Cortado's dependencies installed,
construct the upstream TypeScript program without writing to it:

```bash
CORTADO_JUICE_SHOP_ROOT=/path/to/juice-shop npm run test:juice-shop-corpus
```

The smoke test verifies the exact Git commit, reads the root `tsconfig.json`,
constructs a `typescript.Program`, and confirms that `server.ts` belongs to the
configured program. It prints diagnostic counts rather than treating a clean
type check as a precondition: a corpus checkout deliberately has no installed
upstream dependencies. Those diagnostics are part of the environment record,
not evidence about code behavior.

## Analysis boundary

The upstream root `tsconfig.json` is the configuration authority. Its relevant
settings are TypeScript `es2020`, CommonJS modules, bundler resolution, strict
mode, and the `@juice-shop/*` path mapping. It includes the root server file,
`routes/`, `models/`, `lib/`, `data/`, `views/`, `rsn/`, and test sources. It
excludes `node_modules`, the Angular `frontend`, `dist`, `build`, `vagrant`,
generated static code fixes, Cypress, and declaration files.

The first extraction subset is intentionally smaller than the compiler program:

- [`server.ts`](https://github.com/juice-shop/juice-shop/blob/1618a611b173b4bf114028e6e02549950606e29d/server.ts): Express bootstrap and registration order.
- [`routes/`](https://github.com/juice-shop/juice-shop/tree/1618a611b173b4bf114028e6e02549950606e29d/routes): selected handlers.
- [`models/`](https://github.com/juice-shop/juice-shop/tree/1618a611b173b4bf114028e6e02549950606e29d/models): selected resource operations.
- Only directly needed `lib/` modules: helper and wrapper resolution.

The frontend, tests, Cypress configuration, generated/build output, runtime
assets, and unselected route/model modules are outside the initial extractor
claim. A later spike must explicitly broaden this subset; the TypeScript
program's presence does not imply framework or semantic support for every
included file.

## Citation convention

An observed source citation has this textual form:

```text
<snapshot-commit>:<project-relative-posix-path>#L<start-line>:C<start-column>-L<end-line>:C<end-column>
```

Lines and columns are one-based. The end position is exclusive, matching the
TypeScript compiler API; a zero-width range is invalid. Paths are normalized to
POSIX separators, are relative to the checked-out corpus root, and cannot
escape it. For example:

```text
1618a611b173b4bf114028e6e02549950606e29d:server.ts#L328:C3-L328:C200
```

The range in the example is illustrative, not an asserted extracted fact.
A citation identifies a review location in this immutable snapshot; it grants
neither filesystem access nor authorization evidence. Each observation must
also retain the immediate extractor build identity required by the durable core
boundary.
