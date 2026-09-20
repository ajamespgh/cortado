module FSharpConsumer

open System
open System.IO
open System.Text.Json

// Disposable boundary types. These do not propose a canonical schema.
type OpaqueId = private OpaqueId of string
type Citation = { Resource: string; StartLine: int; StartColumn: int; EndLine: int; EndColumn: int; SnapshotId: string }
type Producer = { Tool: string; Version: string }
type ObservedCall = private { Caller: OpaqueId; Callee: OpaqueId; Citation: Citation; Producer: Producer }
type ObservedBranch = private { Function: OpaqueId; Citation: Citation; Producer: Producer }
type AssertedContext = private { Target: OpaqueId; AuthorityName: string; AuthorityReference: string }
type Report = { Function: OpaqueId; Call: ObservedCall; Branch: ObservedBranch; Context: AssertedContext }

module private Input =
    let required (element: JsonElement) (name: string): JsonElement = element.GetProperty(name)
    let string (element: JsonElement) (name: string): string = required element name |> fun value -> value.GetString()
    let opaque (element: JsonElement) (name: string): OpaqueId = string element name |> OpaqueId
    let citation (element: JsonElement) =
        let start = required element "start"
        let finish = required element "end"
        { Resource = string element "resource"
          StartLine = required start "line" |> fun value -> value.GetInt32()
          StartColumn = required start "column" |> fun value -> value.GetInt32()
          EndLine = required finish "line" |> fun value -> value.GetInt32()
          EndColumn = required finish "column" |> fun value -> value.GetInt32()
          SnapshotId = string element "snapshotId" }
    let producer (element: JsonElement) =
        { Tool = string element "tool"; Version = string element "version" }
    let observedEvidence fact =
        let evidence = required fact "evidence"
        if string evidence "category" <> "observed" then failwith "handoff fact was not observed evidence"
        citation (required evidence "citation"), producer (required evidence "producer")
    let readObserved path =
        use document = JsonDocument.Parse(File.ReadAllText path)
        let root = document.RootElement
        let call = required root "calls" |> fun value -> value[0]
        let branch = required root "branches" |> fun value -> value[0]
        let callCitation, callProducer = observedEvidence call
        let branchCitation, branchProducer = observedEvidence branch
        let observedCall = { Caller = opaque call "callerId"; Callee = opaque call "calleeId"; Citation = callCitation; Producer = callProducer }
        let observedBranch = { Function = opaque branch "functionId"; Citation = branchCitation; Producer = branchProducer }
        observedCall, observedBranch
    let readAssertion path =
        use document = JsonDocument.Parse(File.ReadAllText path)
        let root = document.RootElement
        if string root "category" <> "asserted" then failwith "context was not asserted evidence"
        let authority = required root "authority"
        { Target = opaque root "targetId"; AuthorityName = string authority "name"; AuthorityReference = string authority "reference" }

module Consumer =
    // The type of context differs from the observed analysis facts and remains so in the result.
    let correlate (call: ObservedCall) (branch: ObservedBranch) (context: AssertedContext): Report =
        match call, branch, context with
        | { Caller = caller; Callee = target }, { Function = branchFunction }, { Target = assertedTarget }
            when caller = branchFunction && target = assertedTarget ->
            { Function = caller; Call = call; Branch = branch; Context = context }
        | _ -> failwith "observed facts and asserted context do not correlate"

[<EntryPoint>]
let main arguments =
    if arguments.Length <> 2 then
        eprintfn "usage: FSharpConsumer <observed-handoff.json> <asserted-context.json>"
        2
    else
        let call, branch = Input.readObserved arguments[0]
        let assertion = Input.readAssertion arguments[1]
        let report = Consumer.correlate call branch assertion
        match report.Call, report.Branch, report.Context with
        | _, _, _ ->
            printfn "F# hand-off spike passed: distinct observed call, observed branch, and asserted context correlated by opaque identity."
            0
