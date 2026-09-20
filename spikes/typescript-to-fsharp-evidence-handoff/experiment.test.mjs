import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { extractHandoff, writeExperimentalInputs } from "./extractor.mjs";

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));
const consumerProject = path.join(experimentRoot, "FSharpConsumer", "FSharpConsumer.fsproj");
const buildDirectory = path.join(experimentRoot, "FSharpConsumer", "bin", "Debug", "net10.0");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  return result;
}

test("TypeScript hands only opaque observed facts to a source-free F# consumer", () => {
  const handoff = extractHandoff();
  const serialized = JSON.stringify(handoff);
  assert.equal(handoff.calls.length, 1);
  assert.equal(handoff.branches.length, 1);
  assert.match(handoff.calls[0].callerId, /^entity-[a-f0-9]+$/);
  assert.equal(handoff.calls[0].evidence.category, "observed");
  assert.equal(handoff.branches[0].evidence.category, "observed");
  assert.equal(handoff.calls[0].evidence.citation.snapshotId, handoff.snapshotId);
  assert.doesNotMatch(serialized, /handleRequest|writeAuditRecord|isAuthorized/);

  run("dotnet", ["build", consumerProject, "--nologo"]);
  const isolatedDirectory = mkdtempSync(path.join(os.tmpdir(), "cortado-handoff-spike-"));
  const inputDirectory = path.join(isolatedDirectory, "input");
  const consumerDirectory = path.join(isolatedDirectory, "consumer");
  writeExperimentalInputs(inputDirectory);
  cpSync(buildDirectory, consumerDirectory, { recursive: true });

  assert.equal(existsSync(path.join(isolatedDirectory, "fixture.ts")), false);
  assert.equal(existsSync(path.join(isolatedDirectory, "extractor.mjs")), false);
  assert.deepEqual(readdirSync(inputDirectory).sort(), ["asserted-context.json", "observed-handoff.json"]);

  const result = run("dotnet", [
    "FSharpConsumer.dll",
    path.join(inputDirectory, "observed-handoff.json"),
    path.join(inputDirectory, "asserted-context.json"),
  ], { cwd: consumerDirectory });
  assert.match(result.stdout, /distinct observed call, observed branch, and asserted context/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /handleRequest|writeAuditRecord|isAuthorized/);

  const invalidHandoff = structuredClone(handoff);
  invalidHandoff.calls[0].evidence.category = "asserted";
  const invalidHandoffPath = path.join(inputDirectory, "invalid-observed-handoff.json");
  writeFileSync(invalidHandoffPath, JSON.stringify(invalidHandoff));
  const invalidResult = spawnSync("dotnet", ["FSharpConsumer.dll", invalidHandoffPath, path.join(inputDirectory, "asserted-context.json")], {
    cwd: consumerDirectory,
    encoding: "utf8",
  });
  assert.notEqual(invalidResult.status, 0);
  assert.match(`${invalidResult.stdout}${invalidResult.stderr}`, /handoff fact was not observed evidence/);
});
