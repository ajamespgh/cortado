# Cortado foundation

This directory is the authoritative record of Cortado's product direction,
architecture constraints, engineering policies, and unresolved questions during
the bootstrap phase. It exists alongside, rather than replacing:

- `docs/requirements/` for accepted, implementation-agnostic behavioral
  contracts;
- `docs/decisions/` for accepted architectural decisions; and
- tests for executable regression coverage.

Entries distinguish four statuses:

- **Decision** — direction explicitly chosen by the product owner.
- **Requirement** — observable behavior or constraint explicitly requested.
- **Implication** — a consequence of a decision or requirement; it is not an
  independently approved decision.
- **Open question** or **Recommendation** — intentionally unresolved or
  proposed material.

The pre-existing browser/Node prototype, its requirements, ADRs, tests, and
fixtures are historical evidence. They are not an automatic commitment for the
new direction unless a record here or a later accepted contract says so.

## Documents

- [Product direction](./product-direction.md)
- [Architecture and evidence](./architecture-and-evidence.md)
- [Engineering and agent policy](./engineering-and-agent-policy.md)
- [Open questions](./open-questions.md)
