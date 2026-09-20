# Spike charter: F# constraints at an evidence boundary

**Status:** active experiment; not a proposal for an approved schema.

**Related issue:** [#42](https://github.com/ajamespgh/cortado/issues/42).

## Uncertainty

Can a deliberately small F# representation make the invalid combinations
exposed by the preceding experiments harder to express—specifically, attaching
control-flow evidence to a call fact or call evidence to a control-flow fact—
while still allowing opaque same-snapshot identity correlation and a source-free
consumer query?

## Constraints already decided

- F# should be used for the core wherever practical; this does not yet require
  every component to be F#.
- The canonical layer is language-neutral, and representations such as calls
  and control flow retain distinct semantics.
- Opaque identities may correlate entities across representations within an
  analysis snapshot.
- Evidence categories are conceptually observed, derived, inferred, and
  asserted; confidence remains unresolved.
- AI components do not receive raw source and most do not receive
  developer-assigned symbol names.
- Important schemas require human approval.

## Experiment

Create a disposable F# console program with no external package dependencies.
It will model two separate, in-memory experimental facts: direct calls and
conditional branches. Distinct F# evidence wrapper types must prevent a direct
call from accepting branch evidence, and vice versa. Both facts may use one
opaque experimental function identity in a fixed snapshot.

A consumer function will find opaque callers that both call a chosen target and
have a branch. Its result must retain separate evidence types and citation /
producer values. The program will contain no raw source or developer-assigned
symbol name.

## Observations to record

- Which invalid combinations F# prevents at compile time.
- Whether the types preserve distinct representation semantics in a useful,
  readable way.
- Whether a source-free consumer can join facts using opaque identities.
- Whether citation/provenance can remain evidence-attached rather than being
  merged into a generic graph record.
- Where F# types become awkward or force choices that should remain open.

## Explicitly not authorized

This spike must not decide or create:

- a final canonical evidence, citation, provenance, or identity schema;
- persistent storage, snapshot persistence, MCP/API, visualization, or ML
  contracts;
- final F# project/module architecture or a repository-wide .NET version pin;
- cross-snapshot identity semantics;
- confidence, reliability, likelihood, severity, impact, or exploitability
  semantics;
- a universal graph abstraction; or
- a language/framework extension mechanism.

The F# project and all names/types are disposable reference artifacts only.

## Possible outcomes

1. The types block the intended semantic mix-ups: retain the experiment as
   reference and collect more evidence before proposing a schema.
2. The types are too restrictive or obscure: record the failure and choose a
   different F# boundary experiment.
3. A durable schema question is exposed: stop and request owner approval
   rather than encoding the answer in the experiment.
