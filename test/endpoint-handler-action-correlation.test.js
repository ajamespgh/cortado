import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { correlateEndpointHandlerActions } from '../spikes/endpoint-handler-action-correlation/extractor.mjs'

const source = (name, text) => ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true)

test('correlation returns separate endpoint, guard, handler, and action observations', () => {
  const paths = correlateEndpointHandlerActions({
    serverSourceFile: source('server.ts', `
      import * as security from './lib/insecurity'
      import * as payment from './routes/payment'
      app.get('/cards', security.appendUserId(), utils.asyncHandler(payment.getCards()))
      app.delete('/unguarded', utils.asyncHandler(payment.deleteCard()))
    `),
    helperSourceFile: source('lib/insecurity.ts', `
      export const appendUserId = () => (req, res, next) => next()
    `),
    routeSourceFiles: [{ resource: 'routes/payment.ts', sourceFile: source('routes/payment.ts', `
      export function getCards () { return async () => { await CardModel.findAll({}) } }
      export function deleteCard () { return async () => { await CardModel.destroy({}) } }
    `) }],
    modelSourceFiles: [],
    snapshot: 'snapshot-1',
    selectedOperations: [{ method: 'GET', path: '/cards' }, { method: 'DELETE', path: '/unguarded' }],
    assertedGuardCatalog: [{ authority: 'fixture', moduleSpecifier: './lib/insecurity', members: ['appendUserId'] }],
    assertedActionCatalog: [
      { receiver: 'CardModel', member: 'findAll', action: 'data-read', authority: 'fixture', reference: 'test' },
      { receiver: 'CardModel', member: 'destroy', action: 'data-delete', authority: 'fixture', reference: 'test' }
    ]
  })

  assert.equal(paths[0].handler.status, 'resolved')
  assert.deepEqual(paths[0].actions.map(item => item.fact.action), ['data-read'])
  assert.equal(paths[0].guardEvidence.status, 'catalog-matched-middleware-evidence')
  assert.equal(paths[1].handler.status, 'resolved')
  assert.deepEqual(paths[1].actions.map(item => item.fact.action), ['data-delete'])
  assert.equal(paths[1].guardEvidence.status, 'unresolved-guard-evidence')
  assert.match(paths[1].guardEvidence.limitation, /not an authorization failure/)
})
