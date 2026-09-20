# BR-001: Safe symbol rename is reviewable and explicit

Status: Proposed

## Contract

Given a supported TypeScript project and a statically resolvable symbol:

1. The user can select the symbol.
2. Cortado identifies the affected references.
3. Cortado produces a proposed change set without silently writing files.
4. The user can inspect the affected files and diff.
5. The user explicitly approves or cancels the change.
6. An approved change updates all supported references consistently.
7. Unsupported or ambiguous references are reported clearly.
8. The resulting project remains parseable.

## Rationale

Code changes need to be understandable and reversible as visual editing capabilities grow. The contract must hold regardless of whether the UI is browser-based, desktop-based, or embedded in another development environment.

## Verification

Add fixture-based tests covering proposed changes, preview contents, cancellation, approval, reference consistency, unsupported references, and post-change parsing. Tests should reference `BR-001`.

## Related work

- GitHub issue #7
- GitHub issue #5
