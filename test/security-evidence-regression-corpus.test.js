import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { extractExpressRegistrations } from '../spikes/express-endpoint-extraction/extractor.mjs'
import { correlateEndpointHandlerActions } from '../spikes/endpoint-handler-action-correlation/extractor.mjs'

const corpusRoot = path.resolve('fixtures/security-evidence/juice-shop-derived-v1')
const metadata = JSON.parse(readFileSync(path.join(corpusRoot, 'corpus.json'), 'utf8'))
const fixtureFiles = ['corpus.json', 'server.ts', 'lib/insecurity.ts', 'routes/2fa.ts', 'routes/delivery.ts']
const fixtureHashes = () => Object.fromEntries(fixtureFiles.map(file => [file, createHash('sha256').update(readFileSync(path.join(corpusRoot, file))).digest('hex')]))
const source = file => ts.createSourceFile(file, readFileSync(path.join(corpusRoot, file), 'utf8'), ts.ScriptTarget.ES2020, true)

test('derived Juice Shop corpus is pinned, attributed, and read without mutation', () => {
  const before = fixtureHashes()

  assert.equal(metadata.fixtureSnapshot, 'security-evidence-juice-shop-derived-v1')
  assert.equal(metadata.source.repository, 'https://github.com/juice-shop/juice-shop')
  assert.equal(metadata.source.revision, '1618a611b173b4bf114028e6e02549950606e29d')
  assert.equal(metadata.source.license, 'MIT')
  assert.match(metadata.source.attribution, /OWASP Juice Shop/)
  assert.deepEqual(metadata.cases, [
    'guard-evidence',
    'unrecognized-guard-evidence',
    'wrapper-indirection-ambiguity',
    'computed-registration-unsupported'
  ])

  extractExpressRegistrations(source('server.ts'), { snapshot: metadata.fixtureSnapshot, resource: 'server.ts' })
  assert.deepEqual(fixtureHashes(), before)
})

test('derived Juice Shop corpus preserves evidence and limitation invariants', () => {
  const result = correlateEndpointHandlerActions({
    serverSourceFile: source('server.ts'),
    helperSourceFile: source('lib/insecurity.ts'),
    routeSourceFiles: [
      { resource: 'routes/2fa.ts', sourceFile: source('routes/2fa.ts') },
      { resource: 'routes/delivery.ts', sourceFile: source('routes/delivery.ts') }
    ],
    modelSourceFiles: [],
    snapshot: metadata.fixtureSnapshot,
    selectedOperations: [
      { method: 'GET', path: '/rest/2fa/status' },
      { method: 'GET', path: '/api/Deliverys' },
      { method: 'GET', path: '/wrapped-delivery' }
    ],
    assertedGuardCatalog: [{ authority: 'derived corpus catalog', moduleSpecifier: './lib/insecurity', members: ['isAuthorized'] }],
    assertedActionCatalog: [
      { receiver: 'DeliveryModel', member: 'findAll', action: 'data-read', authority: 'derived corpus catalog', reference: 'fixture selection' },
      { receiver: 'res', member: 'json', action: 'response-emission', authority: 'derived corpus catalog', reference: 'fixture selection' }
    ]
  })

  const byPath = Object.fromEntries(result.map(path => [path.endpoint.fact.path, path]))
  const guarded = byPath['/rest/2fa/status']
  assert.equal(guarded.guardEvidence.status, 'catalog-matched-middleware-evidence')
  assert.equal(guarded.handler.status, 'resolved')
  assert.equal(guarded.handler.observations[0].reference.fact.kind, 'namespace-member-handler-reference')
  assert.equal(guarded.endpoint.fact.citation.snapshot, metadata.fixtureSnapshot)
  assert.equal(guarded.endpoint.fact.citation.resource, 'server.ts')
  assert.match(guarded.guardEvidence.observations[0].fact.limitation, /does not establish effective authorization/)

  const unrecognized = byPath['/api/Deliverys']
  assert.equal(unrecognized.handler.status, 'resolved')
  assert.deepEqual(unrecognized.actions.map(item => item.fact.action), ['data-read', 'response-emission'])
  assert.equal(unrecognized.guardEvidence.status, 'unresolved-guard-evidence')
  assert.match(unrecognized.guardEvidence.limitation, /not an authorization failure finding/)

  const wrapped = byPath['/wrapped-delivery']
  assert.equal(wrapped.handler.status, 'unresolved')
  assert.equal(wrapped.guardEvidence.status, 'unresolved-guard-evidence')
  assert.match(wrapped.handler.limitation, /No selected route-module handler observation/)
  assert.match(wrapped.guardEvidence.limitation, /not an authorization failure finding/)

  const endpointExtraction = extractExpressRegistrations(source('server.ts'), { snapshot: metadata.fixtureSnapshot, resource: 'server.ts' })
  assert.deepEqual(endpointExtraction.unsupported.map(item => item.kind), ['computed-app-member'])
})
