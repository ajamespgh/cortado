import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'
import { extractExpressRegistrations } from '../spikes/express-endpoint-extraction/extractor.mjs'

const snapshot = '1618a611b173b4bf114028e6e02549950606e29d'
const selectedPaths = new Set([
  '/file-upload',
  '/profile/image/file',
  '/rest/memories',
  '/api/Users/:id',
  '/rest/basket',
  '/rest/user/login'
])
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT

if (!suppliedRoot) {
  console.error('Set CORTADO_JUICE_SHOP_ROOT to the pinned Juice Shop checkout described in docs/spikes/2026-09-juice-shop-analysis-corpus.md.')
  process.exitCode = 1
} else {
  const corpusRoot = realpathSync(suppliedRoot)
  const commit = execFileSync('git', ['-C', corpusRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (commit !== snapshot) throw new Error(`Expected Juice Shop revision ${snapshot}, found ${commit}.`)

  const sourcePath = path.join(corpusRoot, 'server.ts')
  const sourceFile = ts.createSourceFile(sourcePath, readFileSync(sourcePath, 'utf8'), ts.ScriptTarget.ES2020, true)
  const extracted = extractExpressRegistrations(sourceFile, { snapshot, resource: 'server.ts' })
  const registrations = extracted.registrations.filter(registration => selectedPaths.has(registration.path))

  console.log(JSON.stringify({
    snapshot,
    selectedPaths: [...selectedPaths],
    registrations,
    unsupported: extracted.unsupported
  }, null, 2))
}
