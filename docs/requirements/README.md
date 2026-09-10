# Behavioral requirements

This directory is the canonical home for Cortado's implementation-agnostic behavioral contracts.

Requirements describe what Cortado must do, not which framework, runtime, library, or API it uses. Each requirement has a stable `BR-###` identifier and should be covered by automated tests wherever practical.

## Requirement lifecycle

1. Propose or change a requirement in a GitHub issue.
2. Discuss scope, rationale, and acceptance criteria.
3. Record the accepted contract in a requirement document.
4. Add or update regression tests using the same requirement ID.
5. Implement the behavior and link the issue, document, and tests.

## Categories

- **Behavioral requirements** — committed user or system behavior.
- **Architectural decisions** — implementation choices and their rationale.
- **Current limitations** — explicitly unsupported behavior.
- **Future ideas** — possibilities that are not commitments.

GitHub issues manage changes and discussion. These documents and the tests are the durable source of truth.

## Index

| ID | Requirement | Status |
| --- | --- | --- |
| [BR-001](./BR-001-safe-symbol-rename.md) | Safe symbol rename is reviewable and explicit | Proposed |
| [BR-002](./BR-002-multi-project-workspace-analysis.md) | Multi-project workspace analysis is explicit | Accepted |
