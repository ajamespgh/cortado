import test from "node:test";
import assert from "node:assert/strict";
import { assertProjectRelative, createChangeSet, createLocation, createWorkspace, resourceUri } from "../src/model.js";

test("project resources are UI-independent and project-relative", () => {
  const workspace = createWorkspace({
    root: "/tmp/project",
    files: [{ path: "src/index.ts", kind: "file" }],
    symbols: [{ id: "symbol:main", name: "main", location: createLocation("src/index.ts", { line: 1, column: 17 }) }],
    projects: [{ id: "tsconfig.json", configPath: "tsconfig.json", files: ["src/index.ts"], status: "ready" }],
  });
  assert.equal(workspace.kind, "workspace");
  assert.equal(workspace.files[0].path, "src/index.ts");
  assert.equal(resourceUri("src/index.ts"), "cortado:/src/index.ts");
  assert.equal(workspace.symbols[0].location.file, "src/index.ts");
  assert.equal(workspace.projects[0].files[0], "src/index.ts");
});

test("workspace rejects paths that escape the project", () => {
  assert.throws(() => assertProjectRelative("../secrets.ts"), /project-relative/);
  assert.throws(() => resourceUri("/absolute.ts"), /project-relative/);
});

test("change sets are explicit, reviewable objects with descending edits", () => {
  const changeSet = createChangeSet({
    id: "rename-1",
    sourceVersion: "workspace-version-1",
    changes: [{ file: "src/index.ts", before: "abcdef", after: "abXef", edits: [{ start: 2, length: 1 }, { start: 4, length: 1 }] }],
  });
  assert.equal(changeSet.kind, "change-set");
  assert.deepEqual(changeSet.changes[0].edits.map((edit) => edit.start), [4, 2]);
  assert.equal(changeSet.changes[0].before, "abcdef");
  assert.equal(changeSet.changes[0].after, "abXef");
});
