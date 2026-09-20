module FSharpEvidenceBoundary

// Every type in this file is a disposable spike artifact, not a proposed schema.
type SnapshotId = private SnapshotId of string
type FunctionId = private FunctionId of string

type SourcePosition = { Line: int; Column: int }
type SourceCitation = {
    Resource: string
    Start: SourcePosition
    End: SourcePosition
    Snapshot: SnapshotId
}

type Producer = { Tool: string; Version: string }
type ObservedEvidence = private {
    Citation: SourceCitation
    Producer: Producer
    Statement: string
}

// These wrappers are the point of the spike: the type system keeps evidence
// belonging to separate analysis representations from being interchangeable.
type CallEvidence = private CallEvidence of ObservedEvidence
type BranchEvidence = private BranchEvidence of ObservedEvidence

type DirectCall = private {
    Caller: FunctionId
    Callee: FunctionId
    Evidence: CallEvidence
}

type ConditionalBranch = private {
    Function: FunctionId
    Evidence: BranchEvidence
}

type Knowledge = {
    Calls: DirectCall list
    Branches: ConditionalBranch list
}

type Investigation = {
    Function: FunctionId
    CallEvidence: CallEvidence
    BranchEvidence: BranchEvidence
}

module SnapshotId =
    let create value = SnapshotId value

module FunctionId =
    let create value = FunctionId value

module ObservedEvidence =
    let create citation producer statement = {
        Citation = citation
        Producer = producer
        Statement = statement
    }

module CallEvidence =
    let create observation = CallEvidence observation

module BranchEvidence =
    let create observation = BranchEvidence observation

module DirectCall =
    let create caller callee (evidence: CallEvidence) = {
        Caller = caller
        Callee = callee
        Evidence = evidence
    }

module ConditionalBranch =
    let create functionId (evidence: BranchEvidence) = {
        Function = functionId
        Evidence = evidence
    }

module Consumer =
    // The consumer joins opaque identities but returns both representation-
    // specific evidence values; it does not turn either fact into a generic edge.
    let callersWithConditionalBranch target knowledge =
        knowledge.Calls
        |> List.filter (fun call -> call.Callee = target)
        |> List.choose (fun call ->
            knowledge.Branches
            |> List.tryFind (fun branch -> branch.Function = call.Caller)
            |> Option.map (fun branch -> {
                Function = call.Caller
                CallEvidence = call.Evidence
                BranchEvidence = branch.Evidence
            }))

module Sample =
    let snapshot = SnapshotId.create "spike-snapshot-fsharp-v1"
    let callerId = FunctionId.create "entity-7a485f52fdb5b33f"
    let calleeId = FunctionId.create "entity-7976833e1ad5dfc8"
    let producer = { Tool = "typescript-compiler-api"; Version = "5.9.3" }

    let callEvidence =
        ObservedEvidence.create
            { Resource = "spikes/fsharp-evidence-boundary/fixture.ts"
              Start = { Line = 6; Column = 7 }
              End = { Line = 6; Column = 28 }
              Snapshot = snapshot }
            producer
            "direct call expression was reported by a language-specific extractor"
        |> CallEvidence.create

    let branchEvidence =
        ObservedEvidence.create
            { Resource = "spikes/fsharp-evidence-boundary/fixture.ts"
              Start = { Line = 6; Column = 3 }
              End = { Line = 8; Column = 4 }
              Snapshot = snapshot }
            producer
            "conditional branch was reported by a language-specific extractor"
        |> BranchEvidence.create

    let knowledge = {
        Calls = [ DirectCall.create callerId calleeId callEvidence ]
        Branches = [ ConditionalBranch.create callerId branchEvidence ]
    }

[<EntryPoint>]
let main _ =
    let result = Consumer.callersWithConditionalBranch Sample.calleeId Sample.knowledge
    if List.length result <> 1 then failwith "expected one correlated result"
    printfn "F# boundary spike passed: one opaque identity correlated separate call and branch evidence."
    0
