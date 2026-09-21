// This file intentionally must NOT type-check after the core and test projects build.
#r "../Cortado.Core/bin/Debug/net10.0/Cortado.Core.dll"

open Cortado.Core

let expectOk = function | Ok value -> value | Error error -> failwith error
let snapshot = SnapshotId.create "snapshot" |> expectOk
let caller = EntityId.create snapshot "caller" |> expectOk
let target = EntityId.create snapshot "target" |> expectOk
let authority = AuthorityReference.create "catalog" "reference" |> expectOk
let assertion = AssertedContext.create target authority
let provenance = AnalyzerProvenance.create "tool" "build" |> expectOk

DirectCallObservation.create caller target assertion provenance |> ignore
