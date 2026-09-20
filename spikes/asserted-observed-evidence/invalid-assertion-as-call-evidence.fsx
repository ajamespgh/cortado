// This file intentionally must NOT type-check after `dotnet build`.
// An asserted external claim cannot substitute for observed direct-call evidence.
#r "bin/Debug/net10.0/AssertedObservedEvidence.dll"
open AssertedObservedEvidence

let invalid = DirectCall.create Sample.callerId Sample.targetId Sample.assertedTarget
