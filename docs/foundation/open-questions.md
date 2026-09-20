# Open questions

These questions are deliberately unresolved. They are not implicit decisions.

1. What exact detector or evidence gatherer provides the first useful A01
   hotspot, and what TypeScript/Next.js application shapes does it support?
   Is chat/MCP investigation required in that initial slice or a preceding/
   parallel discovery capability? This will be resolved during early
   implementation/discovery rather than by upfront design.
2. What framework-agnostic facts and relationships form the initial core
   evidence vocabulary?
   Which components, if any, may receive actual symbol names, and how should
   name-derived information be represented or marked?
   For the future behavior/intent evaluator, what controlled representation of
   names, comments, and documentation is compatible with the code-blind AI
   policy? The structure and storage boundary for role- and purpose-scoped MCP
   exposure remain open; any future choice should consider established
   conventions in ML-powered vulnerability detection.
   It is also open whether a designated extension area or label is useful for
   language- and framework-specific evidence that remains outside the core.
3. What is the first durable storage model for analysis snapshots, findings,
   evidence, annotations, and provenance?
4. What metadata, versioning, confidence, limitations, and transitive
   inference-derived markers are required on evidence and findings? The
   concepts of observed, derived, inferred, and asserted evidence are decided,
   but their concrete representation and use in confidence treatment are not.
   Producer provenance may be represented either by an identifier on each
   evidence item or by an owner for each evidence layer; this has not been
   decided.
   In particular, confidence itself is deferred: its existence on findings,
   calibration, meaning, representation, and treatment across evidence chains
   are not yet defined.
   Stability thresholds and the exact standard evaluation pipeline/framework
   for detecting/reporting unexpected output drift are also open.
   The effect of asserted evidence, including human claims and agent
   assertions, on overall confidence is also deferred.
5. Which surfaces count as important schemas requiring human approval, beyond
   obvious persistent schemas?
6. Does the first release include a human CLI, chat UI, or both, and what
   authorization model governs each?
7. Which runtime/platform constraints (for example .NET version, supported
   operating systems, model distribution, resource limits) apply to local
   analysis?
8. What testing standards demonstrate trustworthy local analysis, evidence
   provenance, information isolation, and A01 findings?
   The validation sequence is decided, but exact fixture expectations and
   candidate learning applications are not yet selected. In particular, it is
   unresolved whether early fixtures assert exact evidence/citation content or
   only stable finding invariants.
9. What retention, attribution, and model-distribution rules apply to
   approved training data after legal review?
