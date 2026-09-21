open Cortado.Core

let expectOk result =
    match result with
    | Ok value -> value
    | Error error -> failwith error

let expectError result =
    match result with
    | Ok _ -> failwith "expected validation failure"
    | Error _ -> ()

let snapshot = SnapshotId.create "snapshot-a" |> expectOk
let otherSnapshot = SnapshotId.create "snapshot-b" |> expectOk
let caller = EntityId.create snapshot "entity-caller" |> expectOk
let target = EntityId.create snapshot "entity-target" |> expectOk
let otherTarget = EntityId.create otherSnapshot "entity-target" |> expectOk
let resource = ProjectRelativePath.create "src/operation.ts" |> expectOk
let startPosition = SourcePosition.create 4 3 |> expectOk
let endPosition = SourcePosition.create 4 19 |> expectOk
let sourceRange = SourceRange.create resource startPosition endPosition |> expectOk
let citation = Citation.create snapshot sourceRange
let otherCitation = Citation.create otherSnapshot sourceRange
let provenance = AnalyzerProvenance.create "typescript-compiler-api" "test-build" |> expectOk
let authority = AuthorityReference.create "framework catalog" "catalog-test" |> expectOk

let call = DirectCallObservation.create caller target citation provenance |> expectOk
let branch = ConditionalBranchObservation.create caller citation provenance |> expectOk
let context = AssertedContext.create target authority
let reviews = Correlation.reviewsFor target [ call ] [ branch ] [ context ]

if List.length reviews <> 1 then failwith "expected one correlated review"
let review = List.head reviews
if CorrelatedReview.functionId review <> caller then failwith "correlation returned the wrong opaque function"
if DirectCallObservation.callee (CorrelatedReview.call review) <> target then failwith "call evidence was not retained"
if ConditionalBranchObservation.subject (CorrelatedReview.branch review) <> caller then failwith "branch evidence was not retained"
if AssertedContext.target (CorrelatedReview.context review) <> target then failwith "asserted context was not retained"

DirectCallObservation.create caller otherTarget citation provenance |> expectError
ConditionalBranchObservation.create caller otherCitation provenance |> expectError
ProjectRelativePath.create "/outside-project.ts" |> expectError
ProjectRelativePath.create "../outside-project.ts" |> expectError
SourcePosition.create 0 1 |> expectError
let reversedRange = SourceRange.create resource endPosition startPosition
expectError reversedRange

printfn "Cortado.Core regression checks passed."
