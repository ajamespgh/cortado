# ADR-002: Canonical project model

## Status

Proposed; first-version contract for issue #9.

## Decision

Cortado will represent workspace resources and analysis results as plain, UI-independent data. The initial model includes project-relative files, modules, symbols, source locations, typed relationships, diagnostics, and explicit change sets. Resource URIs use the `cortado:/` scheme and change-set edits are anchored to project-relative files and a source version.

The model is implemented in `src/model.js`. It does not depend on React Flow, Monaco, Git, Electron, WSL, or a particular transport protocol.

## Scope

The first version validates resource paths, normalizes separators, preserves source locations and diagnostics, and represents reviewable file changes. It does not yet define persistence, workspace discovery, incremental invalidation, Git state, or a complete symbol/relationship schema.

## Rationale

A stable data boundary allows multiple visual projections and runtimes to consume the same project facts. Explicit change sets preserve BR-001’s preview and approval contract while the analysis and UI evolve.
