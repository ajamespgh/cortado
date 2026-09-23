import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { extractResourceActionEvidence } from '../spikes/resource-action-evidence/extractor.mjs'

function source (name, text) {
  return ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true)
}

test('resource action spike separates direct calls from asserted policy action labels', () => {
  const result = extractResourceActionEvidence({
    routeSourceFiles: [{ resource: 'routes/payment.ts', sourceFile: source('routes/payment.ts', `
      import { CardModel } from '../models/card'
      export function payment () {
        return async (req, res) => {
          await CardModel.findAll({ where: { UserId: req.body.UserId } })
          await CardModel.destroy({ where: { id: req.params.id } })
          res.status(200).json({ status: 'ok' })
        }
      }
    `) }],
    modelSourceFiles: [{ resource: 'models/card.ts', sourceFile: source('models/card.ts', `
      Card.init({}, { tableName: 'Cards', sequelize })
    `) }],
    snapshot: 'snapshot-1',
    assertedActionCatalog: [
      { receiver: 'CardModel', member: 'findAll', action: 'data-read', authority: 'fixture policy', reference: 'test' },
      { receiver: 'CardModel', member: 'destroy', action: 'data-delete', authority: 'fixture policy', reference: 'test' }
    ]
  })

  assert.deepEqual(result.observed.directCalls.map(call => [call.handler, call.receiver, call.members]), [
    ['payment', 'CardModel', ['findAll']],
    ['payment', 'CardModel', ['destroy']],
    ['payment', 'res', ['status', 'json']],
    ['payment', 'res', ['status']]
  ])
  assert.deepEqual(result.derived.map(item => item.action), ['data-read', 'data-delete'])
  assert.equal(result.observed.modelInitializations[0].tableName, 'Cards')
})
