import assert from "node:assert/strict";
import test from "node:test";
import { callersOf, extractKnowledge } from "./experiment.mjs";

test("neutral hand-off lets a consumer identify a caller without TypeScript or source", () => {
  const knowledge = extractKnowledge();

  assert.equal(knowledge.snapshotId, "spike-snapshot-v1");
  assert.deepEqual(knowledge.entities.map((entity) => entity.kind), ["function", "function"]);
  assert.equal(knowledge.relationships.length, 1);
  assert.equal(callersOf(knowledge, knowledge.relationships[0].targetId)[0], knowledge.relationships[0].sourceId);
  assert.match(knowledge.relationships[0].sourceId, /^entity-[a-f0-9]{16}$/);
  assert.match(knowledge.relationships[0].targetId, /^entity-[a-f0-9]{16}$/);
  assert.ok(knowledge.evidence.every((item) => item.category === "observed"));
  assert.ok(knowledge.evidence.every((item) => item.citation.snapshotId === knowledge.snapshotId));
  assert.ok(knowledge.evidence.every((item) => item.citation.resource === "spikes/minimal-evidence-vocabulary/fixture.ts"));
  assert.ok(knowledge.evidence.every((item) => item.producer.tool === "typescript-compiler-api"));
  assert.doesNotMatch(JSON.stringify(knowledge), /allowRequest|loadRecord/);
});
