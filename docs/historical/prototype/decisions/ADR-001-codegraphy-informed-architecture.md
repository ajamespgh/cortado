# ADR-001: CodeGraphy-informed architecture boundaries

## Status

Proposed. This record captures research findings for product-direction review; it does not commit Cortado to adopting CodeGraphy or its implementation.

## Context

Cortado needs interactive code visualizations while preserving precise source navigation and the BR-001 safe rename workflow. CodeGraphy provides a useful reference implementation: its Core owns indexing, graph caching, queries, and plugin processing, while interfaces and renderers consume a shared relationship model.

## Decision guidance

Future Cortado work should preserve these boundaries:

- Keep a canonical project and relationship model independent of React Flow, Monaco, VS Code, Git, Electron, and WSL.
- Represent files, folders, packages, symbols, locations, diagnostics, and typed relationships as durable project facts.
- Treat graph scope, filters, search, depth, grouping, and other presentation choices as projections over those facts rather than mutations of the underlying analysis.
- Keep analysis and rendering separate. The browser UI should consume bounded, queryable results from the local service.
- Make freshness, completeness, pagination, and unsupported cases explicit in analysis responses.
- Leave extension points for framework-specific analyzers and alternate projections such as call graphs, component trees, control flow, and data flow.
- Preserve explicit, reviewable change sets. Exploration features must not weaken BR-001’s proposed-preview-approve/cancel-apply contract.

## What Cortado should not adopt automatically

CodeGraphy’s VS Code-first interaction model, force-directed physics, indexing UX, and parser/plugin choices are reference material, not requirements. Cortado should evaluate them against its browser/local-service workflow and TypeScript Language Service precision.

CodeGraphy is primarily an exploration and relationship-discovery tool. No equivalent safe rename change-set workflow was identified in the reviewed materials, so Cortado’s editing and transformation workflow remains a product differentiator.

## Follow-up

- Use this guidance when refining issues #9, #14, #15, #18, and #23.
- Revisit the proposed boundaries when issue #6 receives its broader VS Code architecture decision.
- Record concrete API contracts only after the project model and query requirements are reviewed.

## References

- [CodeGraphy](https://codegraphy.dev/)
- [CodeGraphy V4 domain and architecture context](https://github.com/joesobo/CodeGraphyV4/blob/main/CONTEXT.md)
- [CodeGraphy Marketplace listing](https://marketplace.visualstudio.com/items?itemName=codegraphy.codegraphy)
- [Cortado BR-001](../requirements/BR-001-safe-symbol-rename.md)
