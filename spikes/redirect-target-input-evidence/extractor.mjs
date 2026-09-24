import ts from 'typescript'

const producer = 'typescript-redirect-target-input-evidence-spike'

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

function observed (fact) {
  return { evidenceBasis: 'observed', producer, fact }
}

function requestInput (expression) {
  if (!ts.isPropertyAccessExpression(expression) || !ts.isIdentifier(expression.name)) return undefined
  const container = expression.expression
  if (!ts.isPropertyAccessExpression(container) || !ts.isIdentifier(container.expression)) return undefined
  if (container.expression.text !== 'req' || !['body', 'params', 'query'].includes(container.name.text)) return undefined
  return { container: container.name.text, property: expression.name.text }
}

function directMemberCall (node, receiver, member) {
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && node.expression.expression.text === receiver &&
    node.expression.name.text === member
}

function urlParseContext (node) {
  return ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL' &&
    node.arguments?.[0] && requestInput(node.arguments[0])
}

// This extractor recognizes only a request property expression written directly
// in the selected redirect-target position. URL parsing is retained as nearby
// syntax; it does not establish target resolution or effective validation.
export function extractRedirectTargetInputEvidence ({ sourceFiles, snapshot, assertedReviewCatalog = [] }) {
  const observations = { requestInputs: [], redirectTargets: [], validationContext: [] }
  const directRelations = []
  const unresolvedRelations = []

  for (const input of sourceFiles) {
    const sourceFile = ts.createSourceFile(input.resource, input.text, ts.ScriptTarget.ES2020, true)
    function visit (node) {
      const inputShape = requestInput(node)
      if (inputShape) observations.requestInputs.push(observed({
        kind: 'request-input-occurrence',
        ...inputShape,
        citation: citation(sourceFile, node, snapshot),
        limitation: 'This is a selected request-property expression in source syntax. It does not establish an HTTP request value, trust boundary, or runtime reachability.'
      }))

      if (directMemberCall(node, 'res', 'redirect')) {
        const argument = node.arguments[0]
        const target = observed({
          kind: 'redirect-target-argument',
          receiver: 'res',
          member: 'redirect',
          argumentPosition: 0,
          citation: citation(sourceFile, argument ?? node, snapshot),
          callCitation: citation(sourceFile, node, snapshot),
          limitation: 'This records a selected response-call spelling and target argument position. It does not establish browser navigation, target resolution, response delivery, or an open redirect.'
        })
        observations.redirectTargets.push(target)
        const directInput = argument && requestInput(argument)
        if (directInput) {
          const inputObservation = observed({
            kind: 'request-input-occurrence',
            ...directInput,
            citation: citation(sourceFile, argument, snapshot),
            limitation: 'This is a selected request-property expression in source syntax. It does not establish an HTTP request value, trust boundary, or runtime reachability.'
          })
          directRelations.push({
            evidenceBasis: 'derived',
            producer,
            kind: 'bounded-request-to-redirect-target-relation',
            status: 'direct-syntax-supported',
            input: inputObservation,
            target,
            limitation: 'This relates the same directly written request-property expression to the selected redirect target argument. It does not model aliases, data flow, URL resolution, encoding, host equivalence, branch behavior, validation effectiveness, or exploitability.'
          })
        } else if (argument) {
          unresolvedRelations.push({
            kind: 'bounded-request-to-redirect-target-relation',
            status: 'unresolved-target-form',
            target,
            argumentCitation: citation(sourceFile, argument, snapshot),
            limitation: 'The selected redirect target is not a directly supported request-property expression. Alias, wrapper, computed, and dynamic forms are unresolved.'
          })
        }
      }

      if (urlParseContext(node)) observations.validationContext.push(observed({
        kind: 'url-parsing-context',
        constructor: 'URL',
        citation: citation(sourceFile, node, snapshot),
        limitation: 'This records selected URL-construction syntax near a request expression. It does not establish the constructed value is used, relative-target semantics, allowed origin/host, encoding behavior, or effective validation.'
      }))
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  const asserted = assertedReviewCatalog.map(entry => ({ evidenceBasis: 'asserted', ...entry }))
  return { observations, asserted, directRelations, unresolvedRelations }
}
