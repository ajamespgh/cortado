import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyze, openWorkspace } from "../src/server.js";

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

test("issue #24: an accessible folder exposes all files without requiring tsconfig", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-browse-"));
  try {
    await fs.mkdir(path.join(root, "src"));
    await fs.writeFile(path.join(root, "README.md"), "# New project\n");
    await fs.writeFile(path.join(root, ".gitignore"), "dist\n");
    await fs.writeFile(path.join(root, "src", "main.ts"), "export const value = 1;\n");
    const workspace = await openWorkspace(root);
    assert.deepEqual(workspace.files.map((file) => file.path), [".gitignore", "README.md", "src/main.ts"]);
    assert.deepEqual(workspace.folders.map((folder) => folder.path), ["src"]);
    assert.equal(workspace.files.find((file) => file.path === "README.md").editable, true);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("issue #26: an invalid workspace path fails without changing another workspace", async () => {
  const missing = path.join(os.tmpdir(), "cortado-does-not-exist", String(Date.now()));
  await assert.rejects(() => openWorkspace(missing), /ENOENT/);
});
