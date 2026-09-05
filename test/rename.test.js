import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyRename, planRename } from "../src/server.js";

test("BR-001: planning a rename does not write files, and applying does", async () => {
  const sourceRoot = path.resolve("fixtures/reference-next-app");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-"));
  await fs.cp(sourceRoot, root, { recursive: true });
  const before = await fs.readFile(path.join(root, "lib/projects.ts"), "utf8");
  const oldName = before.includes("getAllProjects") ? "getAllProjects" : "listProjects";
  const newName = oldName === "getAllProjects" ? "listProjects" : "getAllProjects";

  const proposal = await planRename(root, oldName, newName);
  assert.equal(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), before);
  assert.ok(proposal.changes.length >= 2);
  assert.ok(proposal.changes.every((change) => change.before !== change.after));

  await applyRename(root, proposal);
  assert.match(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), new RegExp(newName));
  assert.doesNotMatch(await fs.readFile(path.join(root, "app/api/projects/route.ts"), "utf8"), new RegExp(oldName));
  await fs.rm(root, { recursive: true, force: true });
});

test("BR-001: applying a stale proposal is rejected", async () => {
  const sourceRoot = path.resolve("fixtures/reference-next-app");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-stale-"));
  await fs.cp(sourceRoot, root, { recursive: true });
  const source = await fs.readFile(path.join(root, "lib/projects.ts"), "utf8");
  const oldName = source.includes("getAllProjects") ? "getAllProjects" : "listProjects";
  const proposal = await planRename(root, oldName, "renamedProjects");
  const file = path.join(root, "lib/projects.ts");
  await fs.appendFile(file, "\n// changed after preview\n");
  await assert.rejects(() => applyRename(root, proposal), /File changed since preview/);
  await fs.rm(root, { recursive: true, force: true });
});
