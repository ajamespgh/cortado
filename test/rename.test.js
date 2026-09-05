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

  const proposal = await planRename(root, "getAllProjects", "listProjects");
  assert.equal(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), before);
  assert.ok(proposal.changes.length >= 2);
  assert.ok(proposal.changes.every((change) => change.before !== change.after));

  await applyRename(root, proposal);
  assert.match(await fs.readFile(path.join(root, "lib/projects.ts"), "utf8"), /listProjects/);
  assert.doesNotMatch(await fs.readFile(path.join(root, "app/api/projects/route.ts"), "utf8"), /getAllProjects/);
  await fs.rm(root, { recursive: true, force: true });
});
