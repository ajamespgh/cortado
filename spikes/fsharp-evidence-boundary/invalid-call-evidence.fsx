// This file intentionally must NOT type-check. Run after `dotnet build`:
// dotnet fsi --exec invalid-call-evidence.fsx
// F# should reject a BranchEvidence where DirectCall.create requires CallEvidence.
#r "bin/Debug/net10.0/FSharpEvidenceBoundary.dll"

open FSharpEvidenceBoundary

let invalid = DirectCall.create Sample.callerId Sample.calleeId Sample.branchEvidence
