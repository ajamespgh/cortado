import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveFile } from "../src/server.js";

test("issue #16: saving requires the opened file version", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-edit-"));
  try {
    await fs.writeFile(path.join(root, "example.ts"), "export const value = 1;\n");
    const original = await fs.readFile(path.join(root, "example.ts"), "utf8");
    await saveFile(root, "example.ts", "export const value = 2;\n", original);
    assert.equal(await fs.readFile(path.join(root, "example.ts"), "utf8"), "export const value = 2;\n");
    await assert.rejects(() => saveFile(root, "example.ts", "overwritten", original), /changed since it was opened/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
