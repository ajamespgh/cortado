import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { extractAuthorizationRelevantMiddleware } from '../spikes/authorization-relevant-middleware/extractor.mjs'

function source (name, text) {
  return ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true)
}

test('authorization middleware spike keeps source facts, catalog assertions, and joins separate', () => {
  const result = extractAuthorizationRelevantMiddleware({
    bootstrapSourceFile: source('server.ts', `
      import * as security from './lib/insecurity'
      import * as unrelated from './lib/unrelated'
      app.use('/basket', security.isAuthorized(), security.appendUserId())
      app.get('/orders', security.isAccounting(), handler)
      app.get('/other', unrelated.isAuthorized())
    `),
    helperSourceFile: source('lib/insecurity.ts', `
      export const isAuthorized = () => expressJwt({ secret: publicKey })
      export const isAccounting = () => (req, res, next) => {
        if (req.user?.role === 'accounting') next()
        else res.status(403).json({ error: 'denied' })
      }
      export const appendUserId = () => (req, res, next) => { req.body.UserId = 1; next() }
    `),
    snapshot: 'snapshot-1',
    assertedCatalog: [{
      authority: 'spike fixture',
      moduleSpecifier: './lib/insecurity',
      members: ['isAuthorized', 'isAccounting', 'appendUserId']
    }]
  })

  assert.deepEqual(result.observed.registeredNamespaceMemberCalls.map(call => [call.member, call.registration.path]), [
    ['isAuthorized', '/basket'],
    ['appendUserId', '/basket'],
    ['isAccounting', '/orders']
  ])
  assert.equal(result.observed.registeredNamespaceMemberCalls.some(call => call.registration.path === '/other'), false)
  assert.equal(result.asserted[0].authority, 'spike fixture')
  assert.deepEqual(result.derived.map(item => item.kind), [
    'catalog-member-registered-at-route',
    'catalog-member-registered-at-route',
    'catalog-member-registered-at-route'
  ])
  assert.equal(result.observed.helperShapes.find(item => item.member === 'isAccounting').nested.some(item => item.kind === 'conditional'), true)
})
