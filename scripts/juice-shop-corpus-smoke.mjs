import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const pinnedCommit = '1618a611b173b4bf114028e6e02549950606e29d'
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT

if (!suppliedRoot) {
  console.error('Set CORTADO_JUICE_SHOP_ROOT to a read-only checkout of the pinned Juice Shop revision.')
  process.exitCode = 1
} else {
  const corpusRoot = realpathSync(suppliedRoot)
  const commit = execFileSync('git', ['-C', corpusRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

  if (commit !== pinnedCommit) {
    throw new Error(`Expected Juice Shop revision ${pinnedCommit}, found ${commit}.`)
  }

  const configPath = path.join(corpusRoot, 'tsconfig.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))

  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, corpusRoot, undefined, configPath)
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
  const bootstrap = program.getSourceFile(path.join(corpusRoot, 'server.ts'))

  if (!bootstrap) throw new Error('The configured TypeScript program does not include server.ts.')

  const diagnostics = ts.getPreEmitDiagnostics(program)
  const counts = diagnostics.reduce((result, diagnostic) => {
    const category = ts.DiagnosticCategory[diagnostic.category].toLowerCase()
    result[category] = (result[category] ?? 0) + 1
    return result
  }, {})

  console.log(JSON.stringify({
    corpusRoot,
    commit,
    configPath: path.relative(corpusRoot, configPath),
    rootFileCount: parsed.fileNames.length,
    bootstrap: path.relative(corpusRoot, bootstrap.fileName),
    diagnosticCounts: counts
  }, null, 2))
}
