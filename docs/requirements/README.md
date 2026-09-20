# Current behavioral requirements

This directory is the canonical home for future implementation-agnostic
behavioral contracts. It currently contains no accepted requirements for the
post-direction-change product.

Requirements describe what Cortado must do, not which framework, runtime,
library, or API it uses. Each requirement has a stable `BR-###` identifier and
should be covered by automated tests wherever practical.

## Requirement lifecycle

1. Propose or change a requirement in a GitHub issue.
2. Discuss scope, rationale, and acceptance criteria.
3. Record the accepted contract in a requirement document.
4. Add or update regression tests using the same requirement ID.
5. Implement the behavior and link the issue, document, and tests.

GitHub issues manage changes and discussion. These documents and the tests are
the durable source of truth. The prototype-era BR-001 and BR-002 records are
preserved as [historical records](../historical/prototype/requirements/); their
tests remain useful regression evidence for that prototype, not current
product contracts.
