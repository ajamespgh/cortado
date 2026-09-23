import path from 'node:path'
import ts from 'typescript'

const verbMethods = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'all'])
const registrationMethods = new Set(['use', ...verbMethods])

function position (sourceFile, offset) {
  const location = sourceFile.getLineAndCharacterOfPosition(offset)
  return { line: location.line + 1, column: location.character + 1 }
}

function citation (sourceFile, node, snapshot) {
  const start = position(sourceFile, node.getStart(sourceFile))
  const end = position(sourceFile, node.getEnd())
  return {
    snapshot,
    resource: path.posix.normalize(sourceFile.fileName.replaceAll('\\', '/')),
    start,
    end
  }
}

function staticPaths (node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text]
  if (ts.isArrayLiteralExpression(node) && node.elements.every(element => ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element))) {
    return node.elements.map(element => element.text)
  }
  return undefined
}

function participantForm (node) {
  if (ts.isIdentifier(node)) return 'identifier'
  if (ts.isPropertyAccessExpression(node)) return 'property-access'
  if (ts.isCallExpression(node)) return 'call-expression'
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return 'inline-callback'
  if (ts.isSpreadElement(node)) return 'spread-element'
  return ts.SyntaxKind[node.kind]
}

function participants (sourceFile, nodes, snapshot) {
  return nodes.map((node, index) => ({
    order: index,
    form: participantForm(node),
    citation: citation(sourceFile, node, snapshot)
  }))
}

function appMethodCall (node) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return undefined
  const { expression, name } = node.expression
  if (!ts.isIdentifier(expression) || expression.text !== 'app') return undefined
  return { method: name.text, call: node }
}

function routeChainCall (node) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return undefined
  const outer = node.expression
  if (!verbMethods.has(outer.name.text) || !ts.isCallExpression(outer.expression)) return undefined

  let receiver = outer.expression
  while (ts.isCallExpression(receiver)) {
    const route = appMethodCall(receiver)
    if (route?.method === 'route') return { method: outer.name.text, routeCall: route.call, call: node }
    if (!ts.isPropertyAccessExpression(receiver.expression) || !verbMethods.has(receiver.expression.name.text)) return undefined
    receiver = receiver.expression.expression
  }
  return undefined
}

export function extractExpressRegistrations (sourceFile, { snapshot, resource = 'server.ts' }) {
  // The corpus citation is always project-relative, even if TypeScript was given an absolute filename.
  sourceFile = ts.createSourceFile(resource, sourceFile.text, sourceFile.languageVersion, true)
  const registrations = []
  const unsupported = []

  function addRegistration ({ method, call, pathNode, participantNodes, form }) {
    const paths = staticPaths(pathNode)
    if (!paths) {
      unsupported.push({
        kind: 'dynamic-or-unsupported-path',
        registrationMethod: method.toUpperCase(),
        form,
        citation: citation(sourceFile, call, snapshot),
        limitation: 'The route scope is not a string literal or an array of string literals.'
      })
      return
    }

    for (const routePath of paths) {
      registrations.push({
        kind: 'express-registration',
        registrationMethod: method.toUpperCase(),
        path: routePath,
        form,
        citation: citation(sourceFile, call, snapshot),
        pathCitation: citation(sourceFile, pathNode, snapshot),
        participants: participants(sourceFile, participantNodes, snapshot)
      })
    }
  }

  function visit (node) {
    const routeChain = routeChainCall(node)
    if (routeChain) {
      const [pathNode, ...extraRouteArguments] = routeChain.routeCall.arguments
      if (!pathNode || extraRouteArguments.length > 0) {
        unsupported.push({
          kind: 'unsupported-route-builder',
          citation: citation(sourceFile, routeChain.call, snapshot),
          limitation: 'Expected app.route to receive exactly one static path argument.'
        })
      } else {
        addRegistration({
          method: routeChain.method,
          call: routeChain.call,
          pathNode,
          participantNodes: [...routeChain.call.arguments],
          form: 'route-builder-chain'
        })
      }
    } else {
      const direct = appMethodCall(node)
      if (direct && registrationMethods.has(direct.method)) {
        const { method, call } = direct
        if (method === 'use') {
          const [first, ...rest] = call.arguments
          const paths = first && staticPaths(first)
          if (paths) {
            addRegistration({ method, call, pathNode: first, participantNodes: rest, form: 'direct-call' })
          } else if (call.arguments.length === 1) {
            registrations.push({
              kind: 'express-registration',
              registrationMethod: 'USE',
              path: null,
              form: 'direct-call-global-middleware',
              citation: citation(sourceFile, call, snapshot),
              pathCitation: null,
              participants: participants(sourceFile, call.arguments, snapshot)
            })
          } else if (first) {
            unsupported.push({
              kind: 'ambiguous-use-scope',
              citation: citation(sourceFile, call, snapshot),
              limitation: 'A multi-argument app.use call without a static path can be global middleware or a dynamic path registration.'
            })
          }
        } else if (call.arguments.length >= 2) {
          const [pathNode, ...rest] = call.arguments
          addRegistration({ method, call, pathNode, participantNodes: rest, form: 'direct-call' })
        }
      } else if (ts.isCallExpression(node) && ts.isElementAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'app') {
        unsupported.push({
          kind: 'computed-app-member',
          citation: citation(sourceFile, node, snapshot),
          limitation: 'Computed application member calls are not interpreted as registrations.'
        })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  registrations.sort((left, right) =>
    left.citation.start.line - right.citation.start.line ||
    left.citation.start.column - right.citation.start.column ||
    left.citation.end.line - right.citation.end.line ||
    left.citation.end.column - right.citation.end.column
  )
  return { registrations, unsupported }
}
