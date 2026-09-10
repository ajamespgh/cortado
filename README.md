# Cortado

Cortado is an experimental software-development tool built around interactive visual representations of code. The long-term goal is to make code understandable and eventually editable through multiple synchronized visual views.

## Current milestone

The first vertical slice targets a TypeScript Next.js application:

> Explore a project, trace its modules and symbols, then safely rename a symbol.

The current prototype can:

- analyze a local TypeScript project
- display its module/import graph
- inspect source through a browser UI
- propose a cross-file symbol rename
- preview the proposed changes in Monaco
- apply or cancel the change explicitly
- reject proposals when files changed after preview

## Architecture

The MVP uses two processes:

```text
Browser UI (Vite, React, React Flow, Monaco)
                    │ HTTP
Local service (Node, TypeScript Language Service)
                    │
             Local project workspace
```

The service runs where the project lives, including WSL. The browser renders the UI, which avoids requiring a native graphical runtime during development. Tauri, Electron/VS Code integration, remote workspaces, and Git integration remain future options.

The core direction is to keep workspace, analysis, and change-set interfaces independent of the UI runtime. Git should eventually enrich the workspace rather than be required by it.

## Running locally

Install dependencies:

```bash
npm install
```

Start the local analysis service in one terminal:

```bash
npm start
```

Start the browser UI in another:

```bash
npm run ui
```

Open <http://localhost:5173>.

For the usual development workflow, start both processes and open the UI with one command:

```bash
npm run dev
```

Use `npm run dev -- --no-open` when you do not want the browser to open automatically. Press Ctrl+C to stop both processes. The separate `npm start` and `npm run ui` commands remain available when debugging one side independently.

The service listens on `127.0.0.1:4317` and provides `/health`, `/analyze`, `/file`, `/rename`, and `/rename/apply`.

## Verification

```bash
npm test
npm run build:ui
```

The reference fixture is in [`fixtures/reference-next-app`](fixtures/reference-next-app). It is intentionally small but includes frontend, backend, shared TypeScript, aliases, and cross-file references.

## Development approach

We are deliberately discovery-first:

1. Define the user workflow and behavioral contract.
2. Compare technical options with small spikes.
3. Record architectural decisions and rejected alternatives.
4. Implement the smallest vertical slice.
5. Add fixture-based regression tests.
6. Validate behavior in the actual WSL/browser environment.

Behavioral requirements live in [`docs/requirements`](docs/requirements). GitHub issues manage proposals, discussion, and implementation. Backlog items marked `[Needs review]` require product-direction approval before implementation.

## Roadmap

The active roadmap is maintained in [GitHub Issues](https://github.com/ajamespgh/cortado/issues). Key discovery issues cover requirements, TypeScript analysis, UI options, architecture, and VS Code patterns. Future areas include richer visualizations, filesystem watching, broader Next.js support, Git, desktop packaging, performance, and workspace security.
