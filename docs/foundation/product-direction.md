# Product direction

## Decisions and requirements

- **Product goal:** Cortado identifies code hotspots that give humans or
  agents useful starting points to investigate security vulnerabilities and
  other problems.
- **Success measure:** security-hotspot investigation is one of the first
  valuable workflows, even if intermediate capabilities are needed first.
- **Initial codebase focus:** TypeScript is the first ecosystem in which
  Cortado will demonstrate value.
- **Initial security target:** the first concrete detection target is
  OWASP A01:2025 — Broken Access Control.
- **Initial milestone:** a human runs a process and receives potential A01
  hotspots. The detailed detection approach will be refined closer to
  implementation.
- **Initial milestone non-goals:** source-code editing, automated remediation,
  and recommended remediation are out of scope. Cortado surfaces potential
  hotspots and their evidence for human investigation.
- A possible early investigation pattern is whether an externally reachable
  operation can access a protected resource or perform a sensitive action
  without a demonstrated authorization check. This is an illustrative candidate,
  not a committed detector contract.
- **Initial human experience:** a simple natural-language chat agent that
  answers questions using only Cortado's MCP surface, with citations, is the
  likely early interaction. This is a direction, not a permanent UI decision
  or a confirmed initial-milestone requirement.

## Evidence expectations

- A hotspot can be supported by heterogeneous evidence, including semantic
  control-flow evidence, repository-wide anomaly evidence, and locally run
  ML-based similarity to known CWE-related patterns.
- Each finding must expose the evidence chain appropriate to its signal; a
  uniform confidence claim is not sufficient.
- Findings include a confidence value even when evidence is incomplete or
  ambiguous. Cortado does not silently withhold them solely for that reason;
  the MCP or other consumer controls filtering and sorting.
- **Confidence meaning:** confidence expresses the reliability of a finding's
  supporting evidence. It does not by itself express vulnerability likelihood,
  exploitability, or impact.
- Base scans expose raw data and supporting evidence rather than attempting to
  estimate impact or severity without sufficient context. Higher layers may use
  that material to identify patterns and synthesize new evidence; early users
  will ask natural-language questions about patterns that interest them.
- Future models may learn from synthetic data and data derived from real
  open-source repositories with and without known CWEs. Cross-language examples
  are valuable because the core should reason about comparable logic/evidence
  flows independently of any one implementation language.
- **Product hypothesis:** chat/MCP investigation may help refine the
  correlations across raw evidence that agents need to identify potential
  issues or anomalies. Cortado should not depend on a closed, hard-coded list
  of vulnerability detectors, because future vulnerability classes may not be
  anticipated today.

## Future idea (not first-slice scope)

- A dedicated agent may evaluate actual behavior against the intent implied by
  function, class, and module names, comments, and repository documentation.
  Its purpose would be to identify behavior/intent mismatches. This is not a
  first-slice capability and does not yet define an exception to the rule that
  AI-powered components do not receive raw code.
- Humans should be able to investigate as deeply as needed without
  compromising evidence integrity.

## Scope boundaries

- OWASP Top 10:2025 is an initial taxonomy, not a claim that Cortado fully
  covers the Top 10 or every form of broken access control.
- Other problem categories remain in scope but are not prioritized yet.
- The precise first detector, supported application shapes, and confidence
  calibration remain open. New signals and trained models are expected to
  evolve as Cortado gathers data.
