import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'
import { extractAuthorizationRelevantMiddleware } from '../spikes/authorization-relevant-middleware/extractor.mjs'

const snapshot = '1618a611b173b4bf114028e6e02549950606e29d'
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT

if (!suppliedRoot) {
  console.error('Set CORTADO_JUICE_SHOP_ROOT to the pinned Juice Shop checkout described in docs/spikes/2026-09-juice-shop-analysis-corpus.md.')
  process.exitCode = 1
} else {
  const corpusRoot = realpathSync(suppliedRoot)
  const commit = execFileSync('git', ['-C', corpusRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (commit !== snapshot) throw new Error(`Expected Juice Shop revision ${snapshot}, found ${commit}.`)

  const source = resource => ts.createSourceFile(
    resource,
    readFileSync(path.join(corpusRoot, resource), 'utf8'),
    ts.ScriptTarget.ES2020,
    true
  )
  const result = extractAuthorizationRelevantMiddleware({
    bootstrapSourceFile: source('server.ts'),
    helperSourceFile: source('lib/insecurity.ts'),
    snapshot,
    assertedCatalog: [{
      authority: 'Issue #51 review catalog',
      moduleSpecifier: './lib/insecurity',
      members: ['isAuthorized', 'isAccounting', 'denyAll', 'appendUserId', 'updateAuthenticatedUsers'],
      limitation: 'Membership was selected for this review from the issue scope. It is not compiler-observed authorization evidence.'
    }]
  })
  console.log(JSON.stringify(result, null, 2))
}
