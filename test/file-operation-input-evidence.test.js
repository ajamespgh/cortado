import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { extractFileOperationInputEvidence } from '../spikes/file-operation-input-evidence/extractor.mjs'

const corpusRoot = path.resolve('fixtures/security-evidence/file-operation-derived-v1')
const fixtureFiles = ['corpus.json', 'routes/fileUpload.ts']
const hashes = () => Object.fromEntries(fixtureFiles.map(file => [file, createHash('sha256').update(readFileSync(path.join(corpusRoot, file))).digest('hex')]))

test('file-operation derived fixture remains attributed and read-only', () => {
  const before = hashes()
  const metadata = JSON.parse(readFileSync(path.join(corpusRoot, 'corpus.json'), 'utf8'))
  const result = extractFileOperationInputEvidence({
    sourceFiles: [{ resource: 'routes/fileUpload.ts', text: readFileSync(path.join(corpusRoot, 'routes/fileUpload.ts'), 'utf8') }],
    snapshot: metadata.fixtureSnapshot,
    assertedReviewCatalog: [{ authority: 'issue #59 review input', reference: 'selected Node API spelling', subject: 'fs.createWriteStream' }]
  })

  assert.equal(metadata.source.repository, 'https://github.com/juice-shop/juice-shop')
  assert.equal(metadata.source.revision, '1618a611b173b4bf114028e6e02549950606e29d')
  assert.equal(metadata.source.license, 'MIT')
  assert.match(metadata.source.attribution, /OWASP Juice Shop/)
  assert.deepEqual(metadata.cases, ['direct-request-to-file-sink', 'path-normalization-context', 'alias-flow-unresolved'])
  assert.deepEqual(hashes(), before)
  assert.equal(result.asserted[0].evidenceBasis, 'asserted')
})

test('file-operation spike relates only a directly written request expression to the selected sink argument', () => {
  const result = extractFileOperationInputEvidence({
    sourceFiles: [{ resource: 'routes/fileUpload.ts', text: readFileSync(path.join(corpusRoot, 'routes/fileUpload.ts'), 'utf8') }],
    snapshot: 'file-operation-derived-v1'
  })

  assert.equal(result.directRelations.length, 1)
  const relation = result.directRelations[0]
  assert.equal(relation.evidenceBasis, 'derived')
  assert.equal(relation.status, 'direct-syntax-supported')
  assert.equal(relation.input.producer, 'typescript-file-operation-input-evidence-spike')
  assert.equal(relation.input.fact.container, 'body')
  assert.equal(relation.input.fact.property, 'filename')
  assert.equal(relation.input.fact.citation.snapshot, 'file-operation-derived-v1')
  assert.equal(relation.input.fact.citation.resource, 'routes/fileUpload.ts')
  assert.equal(relation.sink.fact.argumentPosition, 0)
  assert.match(relation.limitation, /does not model aliases/)

  assert.equal(result.observations.validationContext.length, 1)
  assert.match(result.observations.validationContext[0].fact.limitation, /does not establish.*effective validation/)
  assert.equal(result.unresolvedRelations.length, 1)
  assert.equal(result.unresolvedRelations[0].status, 'unresolved-argument-form')
  assert.match(result.unresolvedRelations[0].limitation, /Alias, wrapper, computed, and dynamic forms are unresolved/)
})
