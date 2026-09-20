import assert from "node:assert/strict";
import test from "node:test";
import { callersWithConditionalBranch, extractSeparateRepresentations } from "./experiment.mjs";

test("one opaque identity correlates separate call and control-flow facts with reviewable provenance", () => {
  const knowledge = extractSeparateRepresentations();
  const call = knowledge.callFacts[0];
  const [result] = callersWithConditionalBranch(knowledge, call.calleeId);

  assert.equal(knowledge.callFacts.length, 1);
  assert.equal(knowledge.branchFacts.length, 1);
  assert.equal(result.functionId, call.callerId);
  assert.equal(result.callEvidence.representation, "call");
  assert.equal(result.branchEvidence.representation, "control-flow");
  for (const evidence of [result.callEvidence, result.branchEvidence]) {
    assert.equal(evidence.category, "observed");
    assert.equal(evidence.citation.snapshotId, knowledge.snapshotId);
    assert.equal(evidence.citation.resource, "spikes/identity-provenance-boundary/fixture.ts");
    assert.equal(evidence.producer.tool, "typescript-compiler-api");
    assert.ok(evidence.producer.version);
  }
  assert.notDeepEqual(result.callEvidence.citation, result.branchEvidence.citation);
  assert.doesNotMatch(JSON.stringify(knowledge), /authorize|readProtectedRecord/);
});
