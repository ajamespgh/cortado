import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { extractRedirectTargetInputEvidence } from '../spikes/redirect-target-input-evidence/extractor.mjs'

const corpusRoot = path.resolve('fixtures/security-evidence/redirect-target-derived-v1')
const fixtureFiles = ['corpus.json', 'routes/redirect.ts']
const hashes = () => Object.fromEntries(fixtureFiles.map(file => [file, createHash('sha256').update(readFileSync(path.join(corpusRoot, file))).digest('hex')]))

test('redirect-target derived fixture remains attributable and read-only', () => {
  const before = hashes()
  const metadata = JSON.parse(readFileSync(path.join(corpusRoot, 'corpus.json'), 'utf8'))
  const result = extractRedirectTargetInputEvidence({
    sourceFiles: [{ resource: 'routes/redirect.ts', text: readFileSync(path.join(corpusRoot, 'routes/redirect.ts'), 'utf8') }],
    snapshot: metadata.fixtureSnapshot,
    assertedReviewCatalog: [{ authority: 'issue #60 review input', reference: 'selected response API spelling', subject: 'res.redirect' }]
  })

  assert.equal(metadata.source.kind, 'Cortado-authored minimal regression fixture')
  assert.equal(metadata.source.attribution, 'Cortado contributors')
  assert.equal(metadata.source.externalSourceMaterial, false)
  assert.deepEqual(metadata.cases, ['direct-request-to-redirect-target', 'url-parsing-context', 'alias-flow-unresolved'])
  assert.deepEqual(hashes(), before)
  assert.equal(result.asserted[0].evidenceBasis, 'asserted')
})

test('redirect-target spike relates only a directly written request expression to the selected target argument', () => {
  const result = extractRedirectTargetInputEvidence({
    sourceFiles: [{ resource: 'routes/redirect.ts', text: readFileSync(path.join(corpusRoot, 'routes/redirect.ts'), 'utf8') }],
    snapshot: 'redirect-target-derived-v1'
  })

  assert.equal(result.directRelations.length, 1)
  const relation = result.directRelations[0]
  assert.equal(relation.evidenceBasis, 'derived')
  assert.equal(relation.status, 'direct-syntax-supported')
  assert.equal(relation.input.producer, 'typescript-redirect-target-input-evidence-spike')
  assert.equal(relation.input.fact.container, 'query')
  assert.equal(relation.input.fact.property, 'next')
  assert.equal(relation.input.fact.citation.snapshot, 'redirect-target-derived-v1')
  assert.equal(relation.input.fact.citation.resource, 'routes/redirect.ts')
  assert.equal(relation.target.fact.argumentPosition, 0)
  assert.match(relation.limitation, /does not model aliases/)

  assert.equal(result.observations.validationContext.length, 1)
  assert.match(result.observations.validationContext[0].fact.limitation, /does not establish.*effective validation/)
  assert.equal(result.unresolvedRelations.length, 1)
  assert.equal(result.unresolvedRelations[0].status, 'unresolved-target-form')
  assert.match(result.unresolvedRelations[0].limitation, /Alias, wrapper, computed, and dynamic forms are unresolved/)
})
