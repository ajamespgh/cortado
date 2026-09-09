import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { watchWorkspace } from "../src/workspace-watch.js";

test("issue #11: workspace watcher emits coalesced project-relative changes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cortado-watch-"));
  const events = [];
  const stop = watchWorkspace(root, (changes) => events.push(...changes), { debounceMs: 25 });
  try {
    await fs.writeFile(path.join(root, "example.ts"), "export const value = 1;\n");
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.ok(events.some((event) => event.path === "example.ts"));
  } finally {
    stop();
    await fs.rm(root, { recursive: true, force: true });
  }
});
