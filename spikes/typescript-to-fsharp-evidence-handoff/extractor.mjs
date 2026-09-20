import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(experimentRoot, "fixture.ts");
const fixtureResource = "spikes/typescript-to-fsharp-evidence-handoff/fixture.ts";
const snapshotId = "spike-handoff-snapshot-v1";

// This is intentionally only a repeatable fixture token, not a proposed ID rule.
function opaqueToken(input) {
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

function descendants(node, predicate) {
  const matches = [];
  function visit(child) {
    if (predicate(child)) matches.push(child);
    ts.forEachChild(child, visit);
  }
  ts.forEachChild(node, visit);
  return matches;
}

export function extractHandoff() {
  const program = ts.createProgram({ rootNames: [fixturePath], options: { strict: true } });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fixturePath);
  assert.ok(sourceFile, "fixture must be included in the TypeScript program");

  const declarations = functionDeclarations(sourceFile);
  const ids = new Map(declarations.map((declaration) => [
    declaration,
    `entity-${opaqueToken(`${snapshotId}:${declaration.pos}`)}`,
  ]));
  const calls = [];
  const branches = [];

  for (const declaration of declarations) {
    const functionId = ids.get(declaration);
    for (const branch of descendants(declaration.body, ts.isIfStatement)) {
      branches.push({
        kind: "conditional-branch",
        functionId,
        evidence: {
          category: "observed",
          citation: citation(sourceFile, branch),
          producer: { tool: "typescript-compiler-api", version: ts.version },
        },
      });
    }
    for (const call of descendants(declaration.body, (node) => ts.isCallExpression(node) && ts.isIdentifier(node.expression))) {
      const target = checker.getSymbolAtLocation(call.expression)?.valueDeclaration;
      if (!target || !ids.has(target)) continue;
      calls.push({
        kind: "direct-call",
        callerId: functionId,
        calleeId: ids.get(target),
        evidence: {
          category: "observed",
          citation: citation(sourceFile, call),
          producer: { tool: "typescript-compiler-api", version: ts.version },
        },
      });
    }
  }

  assert.equal(calls.length, 1, "fixture must produce one direct call fact");
  assert.equal(branches.length, 1, "fixture must produce one conditional branch fact");
  return { snapshotId, calls, branches };
}

export function assertedContext(handoff) {
  return {
    category: "asserted",
    targetId: handoff.calls[0].calleeId,
    authority: { name: "fixture framework catalog", reference: "experimental catalog v1" },
  };
}

export function writeExperimentalInputs(outputDirectory) {
  const handoff = extractHandoff();
  const assertion = assertedContext(handoff);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "observed-handoff.json"), JSON.stringify(handoff));
  fs.writeFileSync(path.join(outputDirectory, "asserted-context.json"), JSON.stringify(assertion));
  return { handoff, assertion };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputDirectory = process.argv[2];
  assert.ok(outputDirectory, "provide an output directory");
  writeExperimentalInputs(outputDirectory);
}
