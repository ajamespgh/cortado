import ts from 'typescript'
import { extractExpressRegistrations } from '../express-endpoint-extraction/extractor.mjs'
import { extractAuthorizationRelevantMiddleware } from '../authorization-relevant-middleware/extractor.mjs'
import { extractResourceActionEvidence } from '../resource-action-evidence/extractor.mjs'

function citation (sourceFile, node, snapshot) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())
  return {
    snapshot,
    resource: sourceFile.fileName.replaceAll('\\', '/'),
    start: { line: start.line + 1, column: start.character + 1 },
    end: { line: end.line + 1, column: end.character + 1 }
  }
}

function endpointHandlerReferences (sourceFile, selectedPaths, snapshot) {
  const namespaceModules = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.importClause?.namedBindings || !ts.isNamespaceImport(statement.importClause.namedBindings)) continue
    namespaceModules.set(statement.importClause.namedBindings.name.text, statement.moduleSpecifier.text)
  }
  const references = new Map()
  function visit (node) {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || !ts.isIdentifier(node.expression.expression) || node.expression.expression.text !== 'app') return ts.forEachChild(node, visit)
    const [path, ...participants] = node.arguments
    if (!path || !ts.isStringLiteral(path) || !selectedPaths.has(path.text)) return ts.forEachChild(node, visit)
    const handlers = []
    for (const participant of participants) {
      function findHandler (child) {
        if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression) && ts.isIdentifier(child.expression.expression)) {
          const moduleSpecifier = namespaceModules.get(child.expression.expression.text)
          if (moduleSpecifier) handlers.push({
            kind: 'namespace-member-handler-factory-call',
            moduleSpecifier,
            name: child.expression.name.text,
            citation: citation(sourceFile, child, snapshot)
          })
        }
        ts.forEachChild(child, findHandler)
      }
      findHandler(participant)
    }
    references.set(`${node.expression.name.text.toUpperCase()}:${path.text}`, handlers)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return references
}

function observed (fact, producer) {
  return { category: 'observed', producer, fact }
}

// This answers one fixed investigation query by joining independently-shaped
// observations. It deliberately returns paths, not nodes/edges or a graph.
export function correlateEndpointHandlerActions ({ serverSourceFile, helperSourceFile, routeSourceFiles, modelSourceFiles, snapshot, selectedOperations, assertedGuardCatalog, assertedActionCatalog }) {
  const server = ts.createSourceFile('server.ts', serverSourceFile.text, serverSourceFile.languageVersion, true)
  const selectedPaths = new Set(selectedOperations.map(item => item.path))
  const endpointFacts = extractExpressRegistrations(server, { snapshot, resource: 'server.ts' }).registrations
    .filter(item => selectedOperations.some(operation => operation.path === item.path && operation.method === item.registrationMethod))
  const guardFacts = extractAuthorizationRelevantMiddleware({
    bootstrapSourceFile: server,
    helperSourceFile,
    snapshot,
    assertedCatalog: assertedGuardCatalog
  })
  const actionFacts = extractResourceActionEvidence({ routeSourceFiles, modelSourceFiles, snapshot, assertedActionCatalog })
  const references = endpointHandlerReferences(server, selectedPaths, snapshot)

  return endpointFacts.map(endpoint => {
    const key = `${endpoint.registrationMethod}:${endpoint.path}`
    const handlerReferences = references.get(key) ?? []
    const resolvedHandlers = handlerReferences.flatMap(reference => actionFacts.observed.handlers
      .filter(handler => handler.name === reference.name)
      .map(handler => ({
        handler: observed(handler, 'resource-action-spike'),
        reference: observed(reference, 'endpoint-handler-correlation-spike')
      })))
    const actions = actionFacts.derived
      .filter(action => resolvedHandlers.some(handler => handler.handler.fact.name === action.handler))
      .map(action => ({ category: 'derived', producer: 'resource-action-spike', fact: action }))
    const guards = guardFacts.derived
      .filter(guard => guard.registration.method === endpoint.registrationMethod && guard.registration.path === endpoint.path)
      .map(guard => ({ category: 'derived', producer: 'authorization-middleware-spike', fact: guard }))
    return {
      kind: 'endpoint-handler-action-path',
      endpoint: observed(endpoint, 'express-endpoint-spike'),
      handler: resolvedHandlers.length
        ? { status: 'resolved', observations: resolvedHandlers }
        : { status: 'unresolved', references: handlerReferences, limitation: 'No selected route-module handler observation matched this endpoint reference.' },
      actions,
      guardEvidence: guards.length
        ? { status: 'catalog-matched-middleware-evidence', observations: guards }
        : { status: 'unresolved-guard-evidence', limitation: 'No selected catalog member was observed as a participant of this registration. This is not an authorization failure finding.' },
      limitation: 'This correlates a fixed subset of syntactic observations. It does not model framework execution, route precedence, wrapper behavior, request flow, or vulnerability status.'
    }
  })
}
