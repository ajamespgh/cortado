namespace Cortado.Core

open System

// This library is an in-memory model only. It intentionally defines no wire,
// storage, or source-language integration contract.
type SnapshotId = private SnapshotId of string
type EntityId = private EntityId of SnapshotId * string
type ProjectRelativePath = private ProjectRelativePath of string
type SourcePosition = private SourcePosition of line: int * column: int
type SourceRange = private SourceRange of ProjectRelativePath * SourcePosition * SourcePosition
type Citation = private Citation of SnapshotId * SourceRange
type AnalyzerProvenance = private AnalyzerProvenance of tool: string * buildIdentity: string
type AuthorityReference = private AuthorityReference of authority: string * reference: string

type DirectCallObservation = private {
    Caller: EntityId
    Callee: EntityId
    Citation: Citation
    Provenance: AnalyzerProvenance
}

type ConditionalBranchObservation = private {
    Subject: EntityId
    Citation: Citation
    Provenance: AnalyzerProvenance
}

type AssertedContext = private {
    Target: EntityId
    Authority: AuthorityReference
}

type CorrelatedReview = private {
    Function: EntityId
    Call: DirectCallObservation
    Branch: ConditionalBranchObservation
    Context: AssertedContext
}

module private Validation =
    let nonBlank label value =
        if String.IsNullOrWhiteSpace value then Error $"{label} must not be blank" else Ok value

module SnapshotId =
    let create value = Validation.nonBlank "snapshot identifier" value |> Result.map SnapshotId

module EntityId =
    let create snapshot token = Validation.nonBlank "entity token" token |> Result.map (fun validToken -> EntityId (snapshot, validToken))
    let snapshot (EntityId (value, _)) = value

module ProjectRelativePath =
    let create value =
        match Validation.nonBlank "project-relative resource path" value with
        | Error error -> Error error
        | Ok validPath when IO.Path.IsPathRooted validPath -> Error "resource path must be project-relative"
        | Ok validPath when validPath = ".." || validPath.StartsWith("../") || validPath.StartsWith("..\\") -> Error "resource path must not traverse above the project"
        | Ok validPath -> Ok (ProjectRelativePath validPath)

module SourcePosition =
    let create line column =
        if line < 1 || column < 1 then Error "source position line and column must be positive"
        else Ok (SourcePosition (line, column))

module SourceRange =
    let create resource startPosition endPosition =
        let (SourcePosition (startLine, startColumn)) = startPosition
        let (SourcePosition (endLine, endColumn)) = endPosition
        if endLine < startLine || (endLine = startLine && endColumn < startColumn) then
            Error "source range end must not precede its start"
        else
            Ok (SourceRange (resource, startPosition, endPosition))

module Citation =
    let create snapshot sourceRange = Citation (snapshot, sourceRange)
    let snapshot (Citation (value, _)) = value

module AnalyzerProvenance =
    let create tool buildIdentity =
        match Validation.nonBlank "analyzer tool" tool, Validation.nonBlank "analyzer build identity" buildIdentity with
        | Ok validTool, Ok validBuildIdentity -> Ok (AnalyzerProvenance (validTool, validBuildIdentity))
        | Error error, _ | _, Error error -> Error error

module AuthorityReference =
    let create authority reference =
        match Validation.nonBlank "assertion authority" authority, Validation.nonBlank "assertion reference" reference with
        | Ok validAuthority, Ok validReference -> Ok (AuthorityReference (validAuthority, validReference))
        | Error error, _ | _, Error error -> Error error

module private FactValidation =
    let citationMatchesEntity entity citation = EntityId.snapshot entity = Citation.snapshot citation

module DirectCallObservation =
    let create caller callee citation provenance =
        if not (FactValidation.citationMatchesEntity caller citation) || not (FactValidation.citationMatchesEntity callee citation) then
            Error "direct-call observation entities and citation must share one snapshot"
        else
            Ok { Caller = caller; Callee = callee; Citation = citation; Provenance = provenance }
    let caller observation = observation.Caller
    let callee observation = observation.Callee

module ConditionalBranchObservation =
    let create subject citation provenance =
        if not (FactValidation.citationMatchesEntity subject citation) then
            Error "conditional-branch observation subject and citation must share one snapshot"
        else
            Ok { Subject = subject; Citation = citation; Provenance = provenance }
    let subject observation = observation.Subject

module AssertedContext =
    let create target authority = { Target = target; Authority = authority }
    let target context = context.Target

module Correlation =
    let reviewsFor target calls branches contexts =
        [ for call in calls do
              if DirectCallObservation.callee call = target then
                  for branch in branches do
                      if ConditionalBranchObservation.subject branch = DirectCallObservation.caller call then
                          for context in contexts do
                              if AssertedContext.target context = target then
                                  yield {
                                      Function = DirectCallObservation.caller call
                                      Call = call
                                      Branch = branch
                                      Context = context
                                  } ]

module CorrelatedReview =
    let functionId review = review.Function
    let call review = review.Call
    let branch review = review.Branch
    let context review = review.Context
