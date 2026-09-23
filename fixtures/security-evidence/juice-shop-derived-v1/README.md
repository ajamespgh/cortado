# Derived Juice Shop security-evidence fixtures

These are minimal TypeScript fixtures derived from the access-control evidence
shapes investigated against OWASP Juice Shop. They are not a source snapshot,
not a vulnerability corpus, and not a claim that the represented paths are
secure or insecure.

Upstream provenance:

- repository: <https://github.com/juice-shop/juice-shop>
- revision: `1618a611b173b4bf114028e6e02549950606e29d`
- license: MIT
- attribution: OWASP Juice Shop and its contributors

The fixture snapshot identity is `security-evidence-juice-shop-derived-v1`.
It intentionally keeps only the syntax needed to regress extraction behavior:
an explicit catalog-selected guard, no selected registration guard, a wrapper
that hides a guard and handler from the direct registration subset, and a
computed registration that is unsupported. Tests must read these inputs without
writing them and must retain the stated limitations.
