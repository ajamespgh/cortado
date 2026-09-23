import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'
import { extractResourceActionEvidence } from '../spikes/resource-action-evidence/extractor.mjs'

const snapshot = '1618a611b173b4bf114028e6e02549950606e29d'
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT

if (!suppliedRoot) {
  console.error('Set CORTADO_JUICE_SHOP_ROOT to the pinned Juice Shop checkout described in docs/spikes/2026-09-juice-shop-analysis-corpus.md.')
  process.exitCode = 1
} else {
  const corpusRoot = realpathSync(suppliedRoot)
  const commit = execFileSync('git', ['-C', corpusRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (commit !== snapshot) throw new Error(`Expected Juice Shop revision ${snapshot}, found ${commit}.`)
  const source = resource => ({ resource, sourceFile: ts.createSourceFile(resource, readFileSync(path.join(corpusRoot, resource), 'utf8'), ts.ScriptTarget.ES2020, true) })
  console.log(JSON.stringify(extractResourceActionEvidence({
    routeSourceFiles: [source('routes/payment.ts'), source('routes/fileUpload.ts')],
    modelSourceFiles: [source('models/card.ts')],
    snapshot,
    assertedActionCatalog: [
      { receiver: 'CardModel', member: 'findAll', action: 'data-read', authority: 'Issue #52 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'CardModel', member: 'findOne', action: 'data-read', authority: 'Issue #52 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'CardModel', member: 'destroy', action: 'data-delete', authority: 'Issue #52 review catalog', reference: 'selected Sequelize call spelling' },
      { receiver: 'fs', member: 'createWriteStream', action: 'file-write', authority: 'Issue #52 review catalog', reference: 'selected Node API call spelling' },
      { receiver: 'res', member: 'json', action: 'response-emission', authority: 'Issue #52 review catalog', reference: 'selected Express response API call spelling' }
    ]
  }), null, 2))
}
