# Engineering and agent policy

## Decisions

- The primary agent interface is a local MCP server.
- A CLI is acceptable for humans but is not the preferred automation boundary.
  Shell-oriented agent workflows are avoided because piped command composition
  interacts poorly with command allow-listing and approval requirements.
- Agents may make routine local implementation choices, including ordinary
  variable and function names.
- Important schemas require human approval.
- Before implementing a new or materially changed schema, an agent must stop
  and request human approval. Its blocker report must state why the decision
  blocks progress and propose no more than three resolution options. If the
  agent lacks sufficient project context to propose options confidently, it
  must report the blocker alone rather than expand scope into speculative
  research.
- Once a durable contract is approved, the agent records it in the repository
  immediately, before or alongside the implementation and matching tests.

## Open boundary

The project must still define what constitutes an important schema and which
other externally visible contracts require human approval. Until then, agents
must not treat a reasonable implementation detail as authorization to create
or materially change a durable MCP, storage, evidence, snapshot, or other
externally consumed schema; they must use the escalation policy above.

## Historical implementation status

The existing Node/React browser prototype, HTTP service, direct source editing,
and safe-rename workflow are historical evidence. They do not define the new
primary agent or source-mutation model without a later explicit decision.

## Validation direction

- The smallest initial validation slice is curated test projects/fixtures.
- After fixture coverage, Cortado should be evaluated against freely available
  learning/example applications with documented vulnerabilities and expected
  findings.
- Manual human review is a final mechanism for deciding whether to act on a
  finding; citations must support that review.
- The product owner will review early findings and their supporting evidence to
  judge connection quality and direct adjustments when Cortado makes unreliable
  connections. This human-in-the-loop calibration supplements automated
  fixture testing.
- When review identifies an unreliable connection, the correction should
  normally become a regression fixture so the same failure mode is not silently
  reintroduced.
- The standard evaluation pipeline/framework, rather than a prior-snapshot
  comparison, is the reference for judging output stability and drift.
- Once Cortado is in actual use, passing the standard evaluation pipeline is a
  required release gate. Before that point, the pipeline remains the evaluation
  reference but release governance is not yet the controlling milestone.
- Comparison with other security tools is not a success criterion. Cortado is
  motivated in part by dissatisfaction with their capabilities, so their
  behavior is not the intended benchmark.

## Work-planning direction

- Work prioritization is not decided yet.
- A goal of the development process is to minimize human intervention except
  when a necessary decision genuinely blocks progress.
- Work is attended, not an overnight or unsupervised process. A human may
  select roughly 5–10 clearly scoped stories from an epic for one coding
  session, analogous to a small sprint. The agent chooses routine execution
  order based on dependencies and safety, subject to the established decision
  gates and genuine blockers; the human need not specify a strict priority
  order within the selected batch.
- For an unresolved early implementation question, agents may conduct a small,
  time-bounded technical spike. The spike records findings and a recommendation,
  then stops for a human decision before expanding into production work.
- Every exploratory spike has a short written charter that identifies: the
  uncertainty it is intended to reduce; existing decisions that constrain the
  experiment; observations to record; what the spike is explicitly not
  authorized to decide; and whether its outcome should lead to a decision,
  requirement, another experiment, or no durable change. Spike code is
  disposable unless explicitly promoted and must not silently establish
  production architecture.
- At the end of a coding session, the agent provides a concise sprint-style
  handoff: completed stories, deferred or blocked work, decisions made or
  needed, changed contracts, and verification results.
- GitHub Issues are the operational backlog and discussion record for work.
  Agents update relevant issues with progress, findings, decisions, questions,
  and handoff information. Agents may comment/update assigned issues, create
  follow-up issues, apply labels, and mention the product owner when a required
  decision needs attention. Agents must not close issues.
- An issue pending the product owner's final approval and closure is excluded
  from task selection and can safely be ignored by an agent seeking backlog
  work.
- Use the dedicated GitHub label `status: awaiting-owner-approval` for that
  state. An agent applies it when implementation is ready for final review;
  the issue remains open. The product owner removes the label and/or closes the
  issue after review. Agents exclude issues with this label when selecting work.
