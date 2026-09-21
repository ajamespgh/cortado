// This file intentionally must NOT type-check after the core and test projects build.
#r "../Cortado.Core/bin/Debug/net10.0/Cortado.Core.dll"

open Cortado.Core

let expectOk = function | Ok value -> value | Error error -> failwith error
let snapshot = SnapshotId.create "snapshot" |> expectOk
let caller = EntityId.create snapshot "caller" |> expectOk
let target = EntityId.create snapshot "target" |> expectOk
let resource = ProjectRelativePath.create "src/example.ts" |> expectOk
let position = SourcePosition.create 1 1 |> expectOk
let sourceRange = SourceRange.create resource position position |> expectOk
let citation = Citation.create snapshot sourceRange
let provenance = AnalyzerProvenance.create "tool" "build" |> expectOk
let branch = ConditionalBranchObservation.create caller citation provenance |> expectOk

DirectCallObservation.create caller target branch provenance |> ignore
