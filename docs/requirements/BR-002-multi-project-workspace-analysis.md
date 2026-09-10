# BR-002: Multi-project workspace analysis is explicit

Status: Accepted

## Contract

Given an opened workspace containing one or more supported `tsconfig.json` files:

1. Cortado discovers supported project configurations beneath the workspace, excluding dependency and generated-output directories.
2. Cortado analyzes each configuration independently and identifies the configuration that owns each analyzed file, module, symbol, relationship, and diagnostic.
3. Cortado presents the combined workspace without hiding files because a configuration is missing or invalid.
4. Cortado reports per-project analysis status and configuration errors without preventing valid projects from being explored.
5. A refactoring is scoped to the selected symbol's owning project unless cross-project references are resolved confidently and included in the proposed change set.
6. If a symbol name is ambiguous across projects and no source is selected, Cortado requires the user to disambiguate rather than choosing arbitrarily.

## Initial scope

The first version discovers `tsconfig.json` files recursively, supports nested and parallel projects, and merges their results into one workspace response. It does not yet model package-manager workspaces, TypeScript project-reference build ordering, or arbitrary generated configuration files.

## Verification

Regression tests cover nested and parallel configurations, partial success when one nested configuration is invalid, project ownership, and scoped rename behavior.

## Related work

- GitHub issue #9
- GitHub issue #17
- `BR-001-safe-symbol-rename.md`
