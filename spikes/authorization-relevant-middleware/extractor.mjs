import path from 'node:path'
import ts from 'typescript'
import { extractExpressRegistrations } from '../express-endpoint-extraction/extractor.mjs'

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

function citationKey (value) {
  const { resource, start, end } = value
  return `${resource}:${start.line}:${start.column}:${end.line}:${end.column}`
}

function namespaceImports (sourceFile, snapshot) {
  const imports = []
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings || !ts.isNamespaceImport(statement.importClause.namedBindings)) continue
    imports.push({
      kind: 'namespace-import',
      localBinding: statement.importClause.namedBindings.name.text,
      moduleSpecifier: ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : null,
      citation: citation(sourceFile, statement, snapshot)
    })
  }
  return imports
}

function callMember (node, bindings) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return undefined
  if (!ts.isIdentifier(node.expression.expression) || !bindings.has(node.expression.expression.text)) return undefined
  return { localBinding: node.expression.expression.text, member: node.expression.name.text }
}

function helperShapes (sourceFile, snapshot, memberNames) {
  const observed = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !memberNames.has(declaration.name.text) || !declaration.initializer) continue
      const initializer = declaration.initializer
      const fact = {
        kind: 'exported-helper-shape',
        member: declaration.name.text,
        initializerForm: ts.SyntaxKind[initializer.kind],
        citation: citation(sourceFile, declaration, snapshot),
        nested: []
      }
      function visit (node) {
        if (ts.isIfStatement(node)) fact.nested.push({ kind: 'conditional', citation: citation(sourceFile, node, snapshot) })
        if (ts.isCallExpression(node)) fact.nested.push({ kind: 'call-expression', citation: citation(sourceFile, node, snapshot) })
        ts.forEachChild(node, visit)
      }
      ts.forEachChild(initializer, visit)
      observed.push(fact)
    }
  }
  return observed
}

// `assertedCatalog` is deliberately supplied by the caller. It gives a human or
// external authority's reason for reviewing members; it never changes observed
// source facts into authorization evidence.
export function extractAuthorizationRelevantMiddleware ({ bootstrapSourceFile, helperSourceFile, snapshot, assertedCatalog }) {
  const bootstrap = ts.createSourceFile('server.ts', bootstrapSourceFile.text, bootstrapSourceFile.languageVersion, true)
  const helpers = ts.createSourceFile('lib/insecurity.ts', helperSourceFile.text, helperSourceFile.languageVersion, true)
  const imports = namespaceImports(bootstrap, snapshot)
  const catalogByModule = new Map(assertedCatalog.map(entry => [entry.moduleSpecifier, new Set(entry.members)]))
  const selectedBindings = new Map(imports
    .filter(entry => catalogByModule.has(entry.moduleSpecifier))
    .map(entry => [entry.localBinding, { import: entry, members: catalogByModule.get(entry.moduleSpecifier) }]))

  const registrations = extractExpressRegistrations(bootstrap, { snapshot, resource: 'server.ts' }).registrations
  const participantCitations = new Map()
  for (const registration of registrations) {
    for (const participant of registration.participants) participantCitations.set(citationKey(participant.citation), registration)
  }

  const memberCalls = []
  function visit (node) {
    const member = callMember(node, new Set(selectedBindings.keys()))
    if (member && selectedBindings.get(member.localBinding).members.has(member.member)) {
      const callCitation = citation(bootstrap, node, snapshot)
      const registration = participantCitations.get(citationKey(callCitation))
      if (registration) {
        memberCalls.push({
          kind: 'registered-namespace-member-call',
          localBinding: member.localBinding,
          member: member.member,
          registration: {
            method: registration.registrationMethod,
            path: registration.path,
            citation: registration.citation
          },
          citation: callCitation
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(bootstrap)

  return {
    observed: {
      namespaceImports: imports,
      registeredNamespaceMemberCalls: memberCalls,
      helperShapes: helperShapes(helpers, snapshot, new Set([...catalogByModule.values()].flatMap(members => [...members])))
    },
    asserted: assertedCatalog,
    derived: memberCalls.map(call => ({
      kind: 'catalog-member-registered-at-route',
      member: call.member,
      registration: call.registration,
      sourceCallCitation: call.citation,
      limitation: 'This joins an asserted review catalog to observed syntax. It does not establish effective authorization, request reachability, or a protected resource.'
    }))
  }
}
