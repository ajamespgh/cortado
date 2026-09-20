import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(experimentRoot, "fixture.ts");
const fixtureResource = "spikes/identity-provenance-boundary/fixture.ts";
const snapshotId = "spike-snapshot-identity-v1";

function opaqueToken(input) {
  // Deliberately local to this experiment; not durable identity semantics.
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function sourceCitation(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    resource: fixtureResource,
    start: { line: start.line + 1, column: start.character + 1 },
    end: { line: end.line + 1, column: end.character + 1 },
    snapshotId,
  };
}

function functionDeclarations(sourceFile) {
  const declarations = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) declarations.push(node);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return declarations;
}

function nodesInBody(functionDeclaration, predicate) {
  const matches = [];
  function visit(node) {
    if (predicate(node)) matches.push(node);
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(functionDeclaration.body, visit);
  return matches;
}

function observedEvidence({ idInput, subjectId, representation, statement, sourceFile, node }) {
  return {
    id: `evidence-${opaqueToken(idInput)}`,
    category: "observed",
    subjectId,
    representation,
    statement,
    citation: sourceCitation(sourceFile, node),
    producer: { tool: "typescript-compiler-api", version: ts.version },
  };
}

export function extractSeparateRepresentations() {
  const program = ts.createProgram({ rootNames: [fixturePath], options: { strict: true } });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fixturePath);
  assert.ok(sourceFile, "the fixture must be in the TypeScript program");

  const declarations = functionDeclarations(sourceFile);
  const functionIds = new Map(declarations.map((declaration) => [
    declaration,
    `entity-${opaqueToken(`${snapshotId}:${fixtureResource}:${declaration.pos}`)}`,
  ]));
  const entities = [...functionIds.values()].map((id) => ({ id, kind: "function" }));
  const evidence = [];
  const callFacts = [];
  const branchFacts = [];

  for (const declaration of declarations) {
    const subjectId = functionIds.get(declaration);
    for (const branch of nodesInBody(declaration, ts.isIfStatement)) {
      const supportingEvidence = observedEvidence({
        idInput: `branch:${subjectId}:${branch.pos}`,
        subjectId,
        representation: "control-flow",
        statement: "conditional branch was reported by the TypeScript compiler API",
        sourceFile,
        node: branch,
      });
      evidence.push(supportingEvidence);
      branchFacts.push({ kind: "conditional-branch", functionId: subjectId, evidenceId: supportingEvidence.id });
    }

    for (const call of nodesInBody(declaration, (node) => ts.isCallExpression(node) && ts.isIdentifier(node.expression))) {
      const target = checker.getSymbolAtLocation(call.expression)?.valueDeclaration;
      if (!target || !functionIds.has(target)) continue;
      const targetId = functionIds.get(target);
      const supportingEvidence = observedEvidence({
        idInput: `call:${subjectId}:${targetId}:${call.pos}`,
        subjectId,
        representation: "call",
        statement: "direct call expression was resolved by the TypeScript compiler API",
        sourceFile,
        node: call,
      });
      evidence.push(supportingEvidence);
      callFacts.push({ kind: "direct-call", callerId: subjectId, calleeId: targetId, evidenceId: supportingEvidence.id });
    }
  }

  return { snapshotId, entities, evidence, callFacts, branchFacts };
}

// This consumer uses neither TypeScript nor raw source. It returns the distinct
// evidence records rather than erasing their representations into a graph edge.
export function callersWithConditionalBranch(knowledge, calleeId) {
  const byEvidenceId = new Map(knowledge.evidence.map((item) => [item.id, item]));
  const branchByFunctionId = new Map(knowledge.branchFacts.map((fact) => [fact.functionId, fact]));
  return knowledge.callFacts
    .filter((fact) => fact.kind === "direct-call" && fact.calleeId === calleeId)
    .map((callFact) => ({ callFact, branchFact: branchByFunctionId.get(callFact.callerId) }))
    .filter(({ branchFact }) => branchFact)
    .map(({ callFact, branchFact }) => ({
      functionId: callFact.callerId,
      callEvidence: byEvidenceId.get(callFact.evidenceId),
      branchEvidence: byEvidenceId.get(branchFact.evidenceId),
    }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const knowledge = extractSeparateRepresentations();
  assert.equal(knowledge.callFacts.length, 1);
  assert.equal(knowledge.branchFacts.length, 1);
  const result = callersWithConditionalBranch(knowledge, knowledge.callFacts[0].calleeId);
  assert.equal(result.length, 1);
  assert.notDeepEqual(result[0].callEvidence.citation, result[0].branchEvidence.citation);
  assert.doesNotMatch(JSON.stringify(knowledge), /authorize|readProtectedRecord/);
}
