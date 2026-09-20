# Architecture and evidence

## Decisions

- **Local-first analysis:** initial analysis, including ML-assisted analysis,
  runs locally. Remote processing is a future reconsideration, not an assumed
  capability.
- **F# core:** Cortado should be implemented in F# wherever practical. The
  rationale is functional design and stricter constraints that improve safety
  and maintainability of agent-authored code. This does not yet require every
  possible component to be F#.
- **Core model:** framework-specific support is additive. The core model and
  evidence vocabulary must be framework-agnostic.
- **Language-agnostic core:** the core is intended to represent comparable
  logic/evidence flows from multiple languages (for example, TypeScript,
  Python, and C#), even though TypeScript is the first product-facing scan
  target.
- **Next.js demonstration:** Next.js is the first demonstration environment,
  not a core abstraction.
- **Version-aware integrations:** a Next.js integration determines the
  declared Next.js version and applicable conventions from repository facts
  (for example `package.json` and referenced Next.js symbols on relevant
  paths). It reports uncertainty when applicability cannot be established.
- **Snapshot analysis:** every scan creates an immutable analysis snapshot.
  Findings and citations are bound to that snapshot. Users act on a finding by
  running a new scan; watch/incremental analysis is deferred from the first
  iteration.
- A snapshot analyzes the repository as it exists on disk, including
  uncommitted and untracked files. Git metadata may enrich a later capability
  but is not required for this scope.
- **Evidence-derived inference:** limited local natural-language
  recognition/inference may correlate raw evidence that built-in language
  tooling cannot feasibly correlate. Evidence or conclusions derived from it
  must be explicitly and transitively marked as inference-derived.
- **Layered synthesis:** base analysis exposes raw data and evidence without
  estimating impact or severity. Higher layers may identify patterns and
  synthesize additional evidence, which is subject to the same provenance and
  inference-derived marking rules.
- **No global liveness classification:** Cortado does not need to decide that
  a code path is universally "live" or "not live." An evidence gatherer may
  provide execution/build relevance details when applicable, and must provide
  sources for claims it makes.

## Information isolation

- Agents have no direct visibility into or write access to the analyzed
  repository.
- The local MCP boundary is the sole route through which agents obtain
  Cortado's analysis or affect Cortado-managed state. Exposed MCP capabilities
  are granted according to each AI agent's role and purpose; agents do not
  receive one uniform capability set.
- A dedicated local evidence gatherer may read raw code. AI-powered components
  do not receive raw code; they reason over the gatherer's structured output.
- Most agents also do not receive actual symbol names. This prevents apparent
  developer intent in names from misleading reasoning about raw logic-flow
  facts—for example, a function named `verifyUserAccess` may simply return
  `true`.
- **Agent-visible identity:** first-slice logic-flow facts identify functions,
  modules, routes, and resources with stable opaque identifiers scoped to an
  analysis snapshot. This supports evidence correlation without exposing actual
  names; human citations still locate the underlying source.
- **Scan initiation:** humans select repositories and initiate scans. A
  conversational chat agent may receive a limited re-scan capability, but
  intermediate evidence-gathering agents neither receive nor are aware of
  scan-control capabilities.
- A chat agent may recommend a re-scan and explain why a fresh snapshot would
  help, but it must receive explicit human input/approval before initiating one.
- MCP agents receive structured facts, findings, evidence references, and
  provenance—not raw source text or excerpts.
- Citations may include source locations, including line numbers, as structured
  evidence. A location does not grant an agent filesystem visibility or source
  mutation capability; it lets the human use the cited evidence to scrutinize
  a claim independently.
- **Minimum citation contract:** every source citation includes the
  project-relative file path, source line/range, and analysis-snapshot
  identifier.
- Inference-derived annotations and evidence are persisted only in
  Cortado-managed storage, not in the analyzed repository.
- **Storage minimization:** Cortado-managed storage retains structured derived
  evidence, not raw source text from a scan.
- Non-reversible content hashes or a Merkle-style snapshot fingerprint are
  permitted integrity metadata. They may bind derived evidence to the scanned
  input without retaining raw source.
- Snapshots and their derived evidence persist until explicitly deleted by a
  human; automatic expiration is not an initial behavior.
- Snapshot deletion is atomic from the human's perspective: deleting a snapshot
  removes its findings, annotations, and all derived evidence in one pass.

## Stability expectation

- For the same repository snapshot and fixed Cortado/model versions, scans
  should produce reasonably consistent findings in their amount and nature.
- Exact determinism is not required for ML-assisted analysis, but variation
  must not cause dramatic, unexplained changes. Strict schemas and strong
  evidence are the primary controls.
- Output stability is assessed against Cortado's standard evaluation
  pipeline/framework, rather than requiring comparison with a prior repository
  snapshot.

## First-slice execution boundary

- Analysis is static only. Cortado does not run the target application, its
  tests, builds, or scripts in the first slice.
- Analyze repository-owned source and first-party configuration, and use
  dependency metadata (such as manifests, lockfiles, and declared framework
  versions) as evidence.
- Exclude installed third-party dependency source, such as `node_modules`,
  from the first scan. A future targeted deep dive into a specific dependency
  may be added when a natural need emerges; scanning an entire dependency folder
  is not planned.

## Training-data direction

- Future models may use synthetic data and data generated from real
  open-source repositories, including examples with and without known CWEs.
- **Initial source policy:** accept synthetic data and only repositories with a
  clearly detected, approved permissive license. The initial allowlist is
  `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `Apache-2.0`, and `CC0-1.0`.
- Exclude repositories with no license, unknown/custom licenses, conflicting
  or mixed licensing, or unclear ownership until they receive specific review.
- Maintain source provenance for every training input: upstream URL, immutable
  commit, detected SPDX license, retrieval date, CWE/documentation reference,
  and every transformation used to produce training data.
- Maintain a removal/exclusion path for training inputs.
- Do not train on private or user-scanned repositories by default. Any such use
  requires a separately designed, explicit opt-in policy.
- Obtain legal review before distributing a trained model. This policy is a
  conservative engineering control, not a legal conclusion about training use.

## Implications

- Evidence contracts must be rich enough for agent investigation; agents
  cannot compensate for missing information by inspecting source.
- Symbol-name exposure is an intentional, separately controlled capability;
  the exact exceptions and representation remain open.
- Framework integrations can emit neutral facts such as externally reachable
  operations, authorization checks, protected resources, sensitive actions,
  and convention applicability. The exact vocabulary is still open.
- Because liveness is gatherer-specific, security findings should surface the
  claimed relevance, its sources, and limitations instead of relying on a
  hidden global heuristic.
- Consumers need a stable way to filter and sort findings by their supplied
  confidence value. Confidence denotes evidence reliability; its calibration is
  still open.
