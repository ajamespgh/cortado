module AssertedObservedEvidence

// Disposable spike types only; none are a proposed canonical schema.
type SnapshotId = private SnapshotId of string
type FunctionId = private FunctionId of string
type SourceRange = { Resource: string; StartLine: int; StartColumn: int; EndLine: int; EndColumn: int; Snapshot: SnapshotId }
type ToolProducer = { Tool: string; Version: string }
type ExternalAuthority = { Name: string; Reference: string }

type ObservedFact = private { Citation: SourceRange; Producer: ToolProducer; Statement: string }
type AssertedClaim = private { Target: FunctionId; Authority: ExternalAuthority; Citation: SourceRange option; Statement: string }

type ObservedCallEvidence = private ObservedCallEvidence of ObservedFact
type ObservedBranchEvidence = private ObservedBranchEvidence of ObservedFact
type AssertedTargetClaim = private AssertedTargetClaim of AssertedClaim

type DirectCall = private { Caller: FunctionId; Callee: FunctionId; Evidence: ObservedCallEvidence }
type ConditionalBranch = private { Function: FunctionId; Evidence: ObservedBranchEvidence }
type ReviewReport = {
    Function: FunctionId
    ObservedCall: ObservedCallEvidence
    ObservedBranch: ObservedBranchEvidence
    AssertedTarget: AssertedTargetClaim
}

module SnapshotId = let create value = SnapshotId value
module FunctionId = let create value = FunctionId value
module ObservedFact = let create citation producer statement = { Citation = citation; Producer = producer; Statement = statement }
module AssertedClaim = let create target authority citation statement = { Target = target; Authority = authority; Citation = citation; Statement = statement }
module ObservedCallEvidence = let create fact = ObservedCallEvidence fact
module ObservedBranchEvidence = let create fact = ObservedBranchEvidence fact
module AssertedTargetClaim = let create claim = AssertedTargetClaim claim
module DirectCall = let create caller callee (evidence: ObservedCallEvidence) = { Caller = caller; Callee = callee; Evidence = evidence }
module ConditionalBranch = let create functionId (evidence: ObservedBranchEvidence) = { Function = functionId; Evidence = evidence }

module Consumer =
    // The asserted claim is returned separately; it never becomes behavioral evidence.
    let report caller target call branch assertion =
        match call, branch, assertion with
        | { Caller = actualCaller; Callee = actualTarget; Evidence = callEvidence },
          { Function = branchFunction; Evidence = branchEvidence },
          AssertedTargetClaim claim when actualCaller = caller && actualTarget = target && branchFunction = caller ->
            if claim.Target <> target then failwith "assertion refers to a different opaque target"
            { Function = caller; ObservedCall = callEvidence; ObservedBranch = branchEvidence; AssertedTarget = AssertedTargetClaim claim }
        | _ -> failwith "facts do not correlate"

module Sample =
    let snapshot = SnapshotId.create "spike-snapshot-asserted-v1"
    let callerId = FunctionId.create "entity-7a485f52fdb5b33f"
    let targetId = FunctionId.create "entity-7976833e1ad5dfc8"
    let sourceRange line column = { Resource = "spikes/asserted-observed-evidence/fixture.ts"; StartLine = line; StartColumn = column; EndLine = line; EndColumn = column + 4; Snapshot = snapshot }
    let producer = { Tool = "typescript-compiler-api"; Version = "5.9.3" }
    let callEvidence = ObservedFact.create (sourceRange 6 7) producer "direct call was reported by language tooling" |> ObservedCallEvidence.create
    let branchEvidence = ObservedFact.create (sourceRange 6 3) producer "conditional branch was reported by language tooling" |> ObservedBranchEvidence.create
    let assertedTarget =
        AssertedClaim.create targetId { Name = "framework-convention catalog"; Reference = "local catalog v1" } None "target is asserted protected by an external convention"
        |> AssertedTargetClaim.create
    let call = DirectCall.create callerId targetId callEvidence
    let branch = ConditionalBranch.create callerId branchEvidence

[<EntryPoint>]
let main _ =
    let report = Consumer.report Sample.callerId Sample.targetId Sample.call Sample.branch Sample.assertedTarget
    match report.ObservedCall, report.ObservedBranch, report.AssertedTarget with
    | ObservedCallEvidence _, ObservedBranchEvidence _, AssertedTargetClaim _ ->
        printfn "Asserted/observed boundary spike passed: categories remain distinct."
        0
