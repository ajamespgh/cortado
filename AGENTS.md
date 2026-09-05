# AGENTS.md

## Project context

Cortado is an experimental software-development tool for interactive visual representations of code. The current milestone is a browser-based prototype for exploring and safely renaming symbols in a TypeScript Next.js project.

## Current architecture

- Browser UI: Vite, React, React Flow, and Monaco Editor.
- Local service: framework-free Node process using the TypeScript Language Service/compiler APIs.
- Workspace: local project directory, currently with a reference fixture.
- Runtime: service runs in WSL or another environment containing the project; UI runs in a normal browser.
- Future options: Tauri, Electron/VS Code integration, remote workspaces, and Git.

Do not couple the project model to React Flow, Monaco, Git, Electron, or WSL-specific details. Keep workspace resources project-relative and design change sets as explicit, reviewable objects.

## Important behavioral contract

`BR-001` requires that a symbol rename:

1. identifies affected references;
2. produces a proposed change set without writing files;
3. previews the affected changes;
4. requires explicit apply or cancel;
5. updates supported references consistently;
6. reports unsupported or ambiguous cases;
7. preserves project parseability.

The canonical requirement is [`docs/requirements/BR-001-safe-symbol-rename.md`](docs/requirements/BR-001-safe-symbol-rename.md), and its regression tests reference `BR-001`.

## Local commands

Run `npm install` once, then use separate terminals:

```bash
npm start       # local service on 127.0.0.1:4317
npm run ui      # Vite UI on localhost:5173
npm test        # fixture-based regression tests
npm run build:ui
```

The reference project is under `fixtures/reference-next-app`. Do not assume it has never been edited during manual testing; tests should copy it to a temporary directory before mutating files.

## Working conventions

- Begin with the relevant GitHub issue and inspect existing requirements and decisions.
- Treat implementation-agnostic behavior as a requirement, not merely an issue description.
- Use small technical spikes to answer uncertain stack or architecture questions.
- Preserve existing user changes and avoid destructive Git or filesystem operations.
- Add regression coverage when behavior changes.
- Keep implementation boundaries explicit: UI, service, workspace, analysis, and change sets.
- Validate both automated tests and the WSL-to-browser workflow when relevant.
- Be honest about provisional decisions and record rejected alternatives.

## GitHub workflow

The repository is `ajamespgh/cortado`. GitHub Issues are used for roadmap and task tracking.

- Search for duplicates before creating issues.
- Use issues for proposals, discussion, implementation, and follow-up.
- Backlog items titled `[Needs review]` require product-direction review before implementation.
- Update the relevant issue with findings, decisions, validation results, and links to code or requirements.
- Keep accepted behavioral contracts in `docs/requirements/` and link their automated tests.

## Before handing off work

Run the relevant checks, summarize changed files and verification results, call out anything not tested, and identify the next safe step. If a dependency installation or live service check cannot run in the current environment, state that clearly.
