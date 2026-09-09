import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyze } from "../src/server.js";

test("issue #10: a selected workspace can be analyzed independently of the fixture", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-workspace-"));
  try {
    await fs.writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true }, include: ["*.ts"] }));
    await fs.writeFile(path.join(root, "main.ts"), "export function customWorkspace() { return 1; }\n");
    const workspace = await analyze(root);
    assert.equal(workspace.root, root);
    assert.deepEqual(workspace.files.map((file) => file.path), ["main.ts"]);
    assert.equal(workspace.symbols[0].name, "customWorkspace");
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
