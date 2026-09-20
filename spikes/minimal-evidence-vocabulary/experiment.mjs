import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(experimentRoot, "fixture.ts");
const fixtureResource = "spikes/minimal-evidence-vocabulary/fixture.ts";
const snapshotId = "spike-snapshot-v1";

function opaqueToken(input) {
  // This algorithm is deliberately local to the experiment; it is not a
  // proposal for durable identity generation.
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function citation(sourceFile, node) {
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

function directCalls(functionDeclaration) {
  const calls = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) calls.push(node);
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(functionDeclaration.body, visit);
  return calls;
}

export function extractKnowledge() {
  const program = ts.createProgram({ rootNames: [fixturePath], options: { strict: true } });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fixturePath);
  assert.ok(sourceFile, "the experiment fixture must be in the TypeScript program");

  const declarations = functionDeclarations(sourceFile);
  const functionIds = new Map();
  const entities = declarations.map((declaration) => {
    const id = `entity-${opaqueToken(`${snapshotId}:${fixtureResource}:${declaration.pos}`)}`;
    functionIds.set(declaration, id);
    return { id, kind: "function" };
  });

  const evidence = declarations.map((declaration) => {
    const subjectId = functionIds.get(declaration);
    return {
      id: `evidence-${opaqueToken(`declaration:${subjectId}`)}`,
      category: "observed",
      subjectId,
      statement: "function declaration was reported by the TypeScript compiler API",
      citation: citation(sourceFile, declaration),
      producer: { tool: "typescript-compiler-api", version: ts.version },
    };
  });

  const relationships = [];
  for (const caller of declarations) {
    for (const call of directCalls(caller)) {
      const symbol = checker.getSymbolAtLocation(call.expression);
      const target = symbol?.valueDeclaration;
      if (!target || !functionIds.has(target)) continue;

      const sourceId = functionIds.get(caller);
      const targetId = functionIds.get(target);
      const relationshipEvidence = {
        id: `evidence-${opaqueToken(`call:${sourceId}:${targetId}:${call.pos}`)}`,
        category: "observed",
        subjectId: sourceId,
        statement: "direct call expression was resolved by the TypeScript compiler API",
        citation: citation(sourceFile, call),
        producer: { tool: "typescript-compiler-api", version: ts.version },
      };
      evidence.push(relationshipEvidence);
      relationships.push({
        kind: "invokes",
        sourceId,
        targetId,
        evidenceId: relationshipEvidence.id,
      });
    }
  }

  return { snapshotId, entities, evidence, relationships };
}

// This consumer intentionally has no TypeScript import and no filesystem read.
export function callersOf(knowledge, targetId) {
  const functionIds = new Set(knowledge.entities
    .filter((entity) => entity.kind === "function")
    .map((entity) => entity.id));
  return knowledge.relationships
    .filter((relationship) => relationship.kind === "invokes" && relationship.targetId === targetId)
    .filter((relationship) => functionIds.has(relationship.sourceId))
    .map((relationship) => relationship.sourceId);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const knowledge = extractKnowledge();
  assert.equal(knowledge.entities.length, 2);
  assert.equal(knowledge.relationships.length, 1);
  assert.equal(new Set(callersOf(knowledge, knowledge.relationships[0].targetId)).size, 1);
  assert.doesNotMatch(JSON.stringify(knowledge), /allowRequest|loadRecord/, "names must not cross the boundary");
}
