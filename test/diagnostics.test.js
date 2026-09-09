import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyze } from "../src/server.js";

test("issue #13: incomplete projects remain analyzable and report diagnostics", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-diagnostics-"));
  try {
    await fs.mkdir(path.join(root, "src"));
    await fs.writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true }, include: ["src/**/*.ts"] }));
    await fs.writeFile(path.join(root, "src/broken.ts"), "export const answer: number = 'not a number';\n");
    const workspace = await analyze(root);
    assert.ok(workspace.files.some((file) => file.path === "src/broken.ts"));
    assert.ok(workspace.diagnostics.some((diagnostic) => diagnostic.code === 2322));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
