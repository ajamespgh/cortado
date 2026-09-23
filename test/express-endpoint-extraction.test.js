import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { extractExpressRegistrations } from '../spikes/express-endpoint-extraction/extractor.mjs'

function extract (source) {
  return extractExpressRegistrations(
    ts.createSourceFile('/unrelated/server.ts', source, ts.ScriptTarget.ES2020, true),
    { snapshot: 'snapshot-1', resource: 'server.ts' }
  )
}

test('Express endpoint spike preserves registration form, order, and citations', () => {
  const result = extract(`
    app.post('/upload', parse.single('file'), ensureFile, utils.asyncHandler(handleUpload()))
    app.use('/basket', security.isAuthorized(), security.appendUserId())
    app.route('/users/:id').get(security.isAuthorized()).delete(security.denyAll())
  `)

  assert.deepEqual(result.registrations.map(({ registrationMethod, path, form, participants }) => ({
    registrationMethod, path, form, participantForms: participants.map(participant => participant.form)
  })), [
    { registrationMethod: 'POST', path: '/upload', form: 'direct-call', participantForms: ['call-expression', 'identifier', 'call-expression'] },
    { registrationMethod: 'USE', path: '/basket', form: 'direct-call', participantForms: ['call-expression', 'call-expression'] },
    { registrationMethod: 'GET', path: '/users/:id', form: 'route-builder-chain', participantForms: ['call-expression'] },
    { registrationMethod: 'DELETE', path: '/users/:id', form: 'route-builder-chain', participantForms: ['call-expression'] }
  ])
  assert.deepEqual(result.registrations[0].participants.map(participant => participant.order), [0, 1, 2])
  assert.deepEqual(result.registrations[0].citation, {
    snapshot: 'snapshot-1',
    resource: 'server.ts',
    start: { line: 2, column: 5 },
    end: { line: 2, column: 94 }
  })
})

test('Express endpoint spike does not mistake app settings for a route and reports computed methods', () => {
  const result = extract(`
    app.get('view engine')
    app[method]('/dynamic', handler)
    app.use(pathFromConfig, handler)
  `)

  assert.equal(result.registrations.length, 0)
  assert.deepEqual(result.unsupported.map(item => item.kind), ['computed-app-member', 'ambiguous-use-scope'])
})
