import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const snapshot = '1618a611b173b4bf114028e6e02549950606e29d'
const suppliedRoot = process.env.CORTADO_JUICE_SHOP_ROOT
if (!suppliedRoot) throw new Error('Set CORTADO_JUICE_SHOP_ROOT to the pinned Juice Shop checkout.')
const root = realpathSync(suppliedRoot)
if (execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== snapshot) throw new Error('Corpus revision does not match #48.')

const configPath = path.join(root, 'tsconfig.json')
const config = ts.readConfigFile(configPath, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root, undefined, configPath)
const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
const checker = program.getTypeChecker()
const selected = new Set(['server.ts', 'routes/fileUpload.ts', 'routes/chat.ts'])
const token = value => createHash('sha256').update(value).digest('hex').slice(0, 24)
const entity = (sourceFile, declaration) => token(`${snapshot}:${path.relative(root, sourceFile.fileName)}:${declaration.getStart(sourceFile)}`)
const position = (sourceFile, offset) => { const p = sourceFile.getLineAndCharacterOfPosition(offset); return [p.line + 1, p.character + 1] }
const enclosingFunction = node => { for (let current = node.parent; current; current = current.parent) if (ts.isFunctionDeclaration(current) && current.body) return current }
const calls = []

for (const sourceFile of program.getSourceFiles()) {
  const resource = path.relative(root, sourceFile.fileName).replaceAll('\\', '/')
  if (!selected.has(resource)) continue
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const caller = enclosingFunction(node)
      let symbol = checker.getSymbolAtLocation(node.expression)
      if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      const callee = symbol?.valueDeclaration
      if (caller && callee && ts.isFunctionDeclaration(callee) && callee.body) {
        const [startLine, startColumn] = position(sourceFile, node.getStart(sourceFile))
        const [endLine, endColumn] = position(sourceFile, node.getEnd())
        calls.push([snapshot, entity(sourceFile, caller), entity(callee.getSourceFile(), callee), resource, startLine, startColumn, endLine, endColumn, 'typescript-compiler-api', ts.version, 'direct-call'].join('\t'))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}
const unique = [...new Set(calls)]
if (unique.length < 2) throw new Error('Expected multiple selected direct calls resolved by the compiler program.')
const adapter = path.join('spikes', 'typescript-direct-call-core-adapter', 'Cortado.TypeScriptAdapter.fsproj')
const result = spawnSync('dotnet', ['run', '--project', adapter, '--no-restore'], { cwd: process.cwd(), input: `${unique.join('\n')}\n`, encoding: 'utf8' })
if (result.status !== 0) throw new Error(result.stderr || result.stdout)
process.stdout.write(result.stdout)
