import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'
import { correlateEndpointHandlerActions } from '../spikes/endpoint-handler-action-correlation/extractor.mjs'

const snapshot = '1618a611b173b4bf114028e6e02549950606e29d'
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT

if (!suppliedRoot) {
  console.error('Set CORTADO_JUICE_SHOP_ROOT to the pinned Juice Shop checkout described in docs/spikes/2026-09-juice-shop-analysis-corpus.md.')
  process.exitCode = 1
} else {
  const root = realpathSync(suppliedRoot)
  const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (commit !== snapshot) throw new Error(`Expected Juice Shop revision ${snapshot}, found ${commit}.`)
  const source = resource => ts.createSourceFile(resource, readFileSync(path.join(root, resource), 'utf8'), ts.ScriptTarget.ES2020, true)
  const paths = correlateEndpointHandlerActions({
    serverSourceFile: source('server.ts'),
    helperSourceFile: source('lib/insecurity.ts'),
    routeSourceFiles: [{ resource: 'routes/payment.ts', sourceFile: source('routes/payment.ts') }],
    modelSourceFiles: [{ resource: 'models/card.ts', sourceFile: source('models/card.ts') }],
    snapshot,
    selectedOperations: [{ method: 'GET', path: '/api/Cards' }, { method: 'DELETE', path: '/api/Cards/:id' }],
    assertedGuardCatalog: [{ authority: 'Issue #53 review catalog', moduleSpecifier: './lib/insecurity', members: ['appendUserId'], limitation: 'Catalog membership is not a protection conclusion.' }],
    assertedActionCatalog: [
      { receiver: 'CardModel', member: 'findAll', action: 'data-read', authority: 'Issue #53 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'CardModel', member: 'destroy', action: 'data-delete', authority: 'Issue #53 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'res', member: 'json', action: 'response-emission', authority: 'Issue #53 review catalog', reference: 'selected Express response API call spelling' }
    ]
  })
  console.log(JSON.stringify({ snapshot, paths }, null, 2))
}
