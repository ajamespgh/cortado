open System
open Cortado.Core

let required result = match result with Ok value -> value | Error message -> failwith message

let mapRecord (line: string) =
    let parts = line.Split '\t'
    if parts.Length <> 11 then failwith "expected 11 tab-separated transient adapter fields"
    let snapshot = SnapshotId.create parts.[0] |> required
    let caller = EntityId.create snapshot parts.[1] |> required
    let callee = EntityId.create snapshot parts.[2] |> required
    let resource = ProjectRelativePath.create parts.[3] |> required
    let startPosition = SourcePosition.create (int parts.[4]) (int parts.[5]) |> required
    let endPosition = SourcePosition.create (int parts.[6]) (int parts.[7]) |> required
    let citation = Citation.create snapshot (SourceRange.create resource startPosition endPosition |> required)
    let provenance = AnalyzerProvenance.create parts.[8] parts.[9] |> required
    let observation = DirectCallObservation.create caller callee citation provenance |> required
    // The same callee token in another snapshot must be rejected by the core.
    let otherSnapshot = SnapshotId.create (parts.[0] + "-other") |> required
    let otherCallee = EntityId.create otherSnapshot parts.[2] |> required
    match DirectCallObservation.create caller otherCallee citation provenance with
    | Error _ -> observation
    | Ok _ -> failwith "core accepted a mixed-snapshot direct call"

let records = Console.In.ReadToEnd().Split([| '\n' |], StringSplitOptions.RemoveEmptyEntries)
let observations = records |> Array.map mapRecord
if observations.Length < 2 then failwith "expected multiple compiler-backed direct-call observations"
printfn "Mapped %d compiler-backed direct-call observations into Cortado.Core." observations.Length
