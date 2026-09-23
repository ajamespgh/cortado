import path from 'node:path'
import ts from 'typescript'

function position (sourceFile, offset) {
  const location = sourceFile.getLineAndCharacterOfPosition(offset)
  return { line: location.line + 1, column: location.character + 1 }
}

function citation (sourceFile, node, snapshot) {
  return {
    snapshot,
    resource: sourceFile.fileName.replaceAll('\\', '/'),
    start: position(sourceFile, node.getStart(sourceFile)),
    end: position(sourceFile, node.getEnd())
  }
}

function imports (sourceFile, snapshot) {
  return sourceFile.statements.flatMap(statement => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return []
    const clause = statement.importClause
    const bindings = []
    if (clause?.name) bindings.push(clause.name.text)
    if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) bindings.push(clause.namedBindings.name.text)
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) bindings.push(...clause.namedBindings.elements.map(element => element.name.text))
    return [{ kind: 'import-binding', moduleSpecifier: statement.moduleSpecifier.text, bindings, citation: citation(sourceFile, statement, snapshot) }]
  })
}

function callPath (expression, members = []) {
  if (ts.isPropertyAccessExpression(expression)) return callPath(expression.expression, [expression.name.text, ...members])
  if (ts.isCallExpression(expression)) return callPath(expression.expression, members)
  if (!ts.isIdentifier(expression)) return undefined
  return { receiver: expression.text, members }
}

function resourceInitializations (sourceFile, snapshot) {
  const facts = []
  function visit (node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'init' && ts.isIdentifier(node.expression.expression)) {
      const options = node.arguments[1]
      let tableName
      if (options && ts.isObjectLiteralExpression(options)) {
        const property = options.properties.find(item => ts.isPropertyAssignment(item) && ts.isIdentifier(item.name) && item.name.text === 'tableName')
        if (property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) tableName = property.initializer.text
      }
      facts.push({
        kind: 'model-initialization',
        modelBinding: node.expression.expression.text,
        tableName: tableName ?? null,
        citation: citation(sourceFile, node, snapshot)
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return facts
}

// The catalog is an explicit policy interpretation supplied to this spike. A
// direct call to a similarly named method is observed syntax, not a sensitive
// action classification until it is joined with this asserted input.
export function extractResourceActionEvidence ({ routeSourceFiles, modelSourceFiles, snapshot, assertedActionCatalog }) {
  const observed = { imports: [], handlers: [], directCalls: [], modelInitializations: [] }
  for (const input of routeSourceFiles) {
    const sourceFile = ts.createSourceFile(input.resource, input.sourceFile.text, input.sourceFile.languageVersion, true)
    observed.imports.push(...imports(sourceFile, snapshot))
    for (const statement of sourceFile.statements) {
      if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body || !statement.modifiers?.some(item => item.kind === ts.SyntaxKind.ExportKeyword)) continue
      const handler = { kind: 'exported-handler', name: statement.name.text, citation: citation(sourceFile, statement, snapshot) }
      observed.handlers.push(handler)
      function visit (node) {
        if (ts.isCallExpression(node)) {
          const path = callPath(node.expression)
          if (path?.members.length) observed.directCalls.push({
            kind: 'direct-member-call',
            handler: handler.name,
            receiver: path.receiver,
            members: path.members,
            citation: citation(sourceFile, node, snapshot)
          })
        }
        ts.forEachChild(node, visit)
      }
      ts.forEachChild(statement.body, visit)
    }
  }
  for (const input of modelSourceFiles) {
    const sourceFile = ts.createSourceFile(input.resource, input.sourceFile.text, input.sourceFile.languageVersion, true)
    observed.modelInitializations.push(...resourceInitializations(sourceFile, snapshot))
  }

  const catalog = new Map(assertedActionCatalog.map(entry => [`${entry.receiver}:${entry.member}`, entry]))
  const derived = observed.directCalls.flatMap(call => {
    const policy = catalog.get(`${call.receiver}:${call.members.at(-1)}`)
    return policy ? [{
      kind: 'policy-catalog-call-match',
      handler: call.handler,
      action: policy.action,
      authority: policy.authority,
      reference: policy.reference,
      callCitation: call.citation,
      limitation: 'This is a policy-catalog join with an observed direct call. It does not prove the call completes, affects a particular record, or has a sensitive effect.'
    }] : []
  })

  return { observed, asserted: assertedActionCatalog, derived }
}
