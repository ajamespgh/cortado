import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { applyRename, planRename } from "../src/server.js";

async function copyFixture(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.cp(path.resolve("fixtures/reference-next-app"), root, { recursive: true });
  return root;
}

async function snapshot(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.push([path.relative(root, file), await fs.readFile(file, "utf8")]);
    }
  }
  await visit(root);
  return files.sort((a, b) => a[0].localeCompare(b[0]));
}

test("BR-001: planning a rename does not write files, and applying does", async () => {
  const root = await copyFixture("cortado-");
  try {
  const before = await fs.readFile(path.join(root, "lib/projects.ts"), "utf8");
  const oldName = before.includes("getProjects") ? "getProjects" : "getAllProjects";
  const newName = oldName === "getProjects" ? "listProjects" : "getProjects";

  const proposal = await planRename(root, oldName, newName);
  assert.equal(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), before);
  assert.ok(proposal.changes.length >= 2);
  assert.ok(proposal.changes.every((change) => change.before !== change.after));

  await applyRename(root, proposal);
  assert.match(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), new RegExp(newName));
  assert.doesNotMatch(await fs.readFile(path.join(root, "app/api/projects/route.ts"), "utf8"), new RegExp(oldName));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("BR-001: applying a stale proposal is rejected", async () => {
  const root = await copyFixture("cortado-stale-");
  try {
  const source = await fs.readFile(path.join(root, "lib/projects.ts"), "utf8");
  const oldName = source.includes("getProjects") ? "getProjects" : "getAllProjects";
  const proposal = await planRename(root, oldName, "renamedProjects");
  const file = path.join(root, "lib/projects.ts");
  await fs.appendFile(file, "\n// changed after preview\n");
  await assert.rejects(() => applyRename(root, proposal), /File changed since preview/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("BR-001: cancelling a proposal leaves the temporary workspace unchanged", async () => {
  const root = await copyFixture("cortado-cancel-");
  try {
    const before = await snapshot(root);
    const proposal = await planRename(root, "getProjects", "listProjects");
    assert.ok(proposal.changes.length > 0);
    assert.deepEqual(await snapshot(root), before);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("BR-001: the applied workspace remains parseable", async () => {
  const root = await copyFixture("cortado-parse-");
  try {
    const proposal = await planRename(root, "getProjects", "listProjects");
    await applyRename(root, proposal);
    const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    const diagnostics = program.getSyntacticDiagnostics();
    assert.deepEqual(diagnostics, []);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("BR-001: unsupported symbols are reported without changing files", async () => {
  const root = await copyFixture("cortado-unsupported-");
  try {
    const before = await snapshot(root);
    await assert.rejects(() => planRename(root, "missingProjectFunction", "renamedProjects"), /Could not find exported function/);
    assert.deepEqual(await snapshot(root), before);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
