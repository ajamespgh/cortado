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
    assert.deepEqual(workspace.symbols[0].location.start, { line: 1, column: 17 });
    assert.deepEqual(workspace.symbols[0].location.end, { line: 1, column: 32 });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("issue #17: a workspace combines parallel and nested TypeScript projects", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-multi-project-"));
  try {
    await fs.mkdir(path.join(root, "client"), { recursive: true });
    await fs.mkdir(path.join(root, "packages", "shared"), { recursive: true });
    await fs.writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true }, include: ["client/**/*.ts", "packages/shared/*.ts"] }));
    await fs.writeFile(path.join(root, "client", "main.ts"), "import { sharedLabel } from '../packages/shared/value'; export function render() { return sharedLabel(); }\n");
    await fs.writeFile(path.join(root, "packages", "shared", "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true }, include: ["*.ts"] }));
    await fs.writeFile(path.join(root, "packages", "shared", "value.ts"), "export function sharedLabel() { return 'shared'; }\n");

    const workspace = await analyze(root);

    assert.deepEqual(workspace.projects.map((project) => project.configPath), ["packages/shared/tsconfig.json", "tsconfig.json"]);
    assert.deepEqual(workspace.projects.map((project) => project.status), ["ready", "ready"]);
    assert.deepEqual(workspace.files.map((file) => file.path), ["client/main.ts", "packages/shared/value.ts"]);
    assert.ok(workspace.edges.some((edge) => edge.from === "client/main.ts" && edge.to === "packages/shared/value.ts"));
    assert.equal(workspace.symbols.find((symbol) => symbol.name === "sharedLabel")?.project, "packages/shared/tsconfig.json");
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("issue #17: an invalid nested config reports coverage without hiding valid projects", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-partial-project-"));
  try {
    await fs.mkdir(path.join(root, "broken"));
    await fs.writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ include: ["*.ts"] }));
    await fs.writeFile(path.join(root, "main.ts"), "export const usable = true;\n");
    await fs.writeFile(path.join(root, "broken", "tsconfig.json"), "{ invalid json");

    const workspace = await analyze(root);

    assert.equal(workspace.projects.find((project) => project.configPath === "tsconfig.json")?.status, "ready");
    assert.equal(workspace.projects.find((project) => project.configPath === "broken/tsconfig.json")?.status, "error");
    assert.ok(workspace.files.some((file) => file.path === "main.ts"));
    assert.ok(workspace.diagnostics.some((diagnostic) => diagnostic.project === "broken/tsconfig.json"));
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
