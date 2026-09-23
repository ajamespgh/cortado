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
    routeSourceFiles: [
      { resource: 'routes/2fa.ts', sourceFile: source('routes/2fa.ts') },
      { resource: 'routes/delivery.ts', sourceFile: source('routes/delivery.ts') },
      { resource: 'routes/payment.ts', sourceFile: source('routes/payment.ts') }
    ],
    modelSourceFiles: [],
    snapshot,
    selectedOperations: [
      { method: 'GET', path: '/rest/2fa/status' },
      { method: 'GET', path: '/api/Deliverys' },
      { method: 'GET', path: '/api/Cards' }
    ],
    assertedGuardCatalog: [{
      authority: 'Issue #54 review catalog',
      moduleSpecifier: './lib/insecurity',
      members: ['isAuthorized', 'appendUserId'],
      limitation: 'Catalog membership is not a protection conclusion.'
    }],
    assertedActionCatalog: [
      { receiver: 'DeliveryModel', member: 'findAll', action: 'data-read', authority: 'Issue #54 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'CardModel', member: 'findAll', action: 'data-read', authority: 'Issue #54 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'res', member: 'json', action: 'response-emission', authority: 'Issue #54 review catalog', reference: 'selected Express response API call spelling' }
    ]
  })
  console.log(JSON.stringify({ snapshot, paths }, null, 2))
}
