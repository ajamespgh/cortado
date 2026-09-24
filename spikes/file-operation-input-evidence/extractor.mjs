import ts from 'typescript'

const producer = 'typescript-file-operation-input-evidence-spike'

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

// This extractor intentionally recognizes only a request property expression
// passed directly to the selected sink argument. It neither resolves aliases
// nor evaluates path checks; those forms are returned as unresolved context.
export function extractFileOperationInputEvidence ({ sourceFiles, snapshot, assertedReviewCatalog = [] }) {
  const observations = { requestInputs: [], fileOperationSinks: [], validationContext: [] }
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
        limitation: 'This is a selected request-property expression in source syntax. It does not establish a request value, trust boundary, or runtime reachability.'
      }))

      if (directMemberCall(node, 'fs', 'createWriteStream')) {
        const argument = node.arguments[0]
        const sink = observed({
          kind: 'file-operation-sink-argument',
          receiver: 'fs',
          member: 'createWriteStream',
          argumentPosition: 0,
          citation: citation(sourceFile, argument ?? node, snapshot),
          callCitation: citation(sourceFile, node, snapshot),
          limitation: 'This records a selected call spelling and argument position. It does not establish file creation, a resolved path, completion, overwrite behavior, or filesystem effect.'
        })
        observations.fileOperationSinks.push(sink)
        const directInput = argument && requestInput(argument)
        if (directInput) {
          const inputObservation = observed({
            kind: 'request-input-occurrence',
            ...directInput,
            citation: citation(sourceFile, argument, snapshot),
            limitation: 'This is a selected request-property expression in source syntax. It does not establish a request value, trust boundary, or runtime reachability.'
          })
          directRelations.push({
            evidenceBasis: 'derived',
            producer,
            kind: 'bounded-request-to-file-sink-relation',
            status: 'direct-syntax-supported',
            input: inputObservation,
            sink,
            limitation: 'This relates the same directly written request-property expression to the selected sink argument. It does not model aliases, data flow, path normalization, containment, traversal, execution order, or exploitability.'
          })
        } else if (argument) {
          unresolvedRelations.push({
            kind: 'bounded-request-to-file-sink-relation',
            status: 'unresolved-argument-form',
            sink,
            argumentCitation: citation(sourceFile, argument, snapshot),
            limitation: 'The selected sink argument is not a directly supported request-property expression. Alias, wrapper, computed, and dynamic forms are unresolved.'
          })
        }
      }

      if (directMemberCall(node, 'path', 'normalize') && node.arguments[0] && requestInput(node.arguments[0])) {
        observations.validationContext.push(observed({
          kind: 'path-normalization-context',
          receiver: 'path',
          member: 'normalize',
          argumentPosition: 0,
          citation: citation(sourceFile, node, snapshot),
          limitation: 'This records selected normalization-call syntax near a request expression. It does not establish that its result is used, containment, safe path resolution, or effective validation.'
        }))
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  const asserted = assertedReviewCatalog.map(entry => ({ evidenceBasis: 'asserted', ...entry }))
  return { observations, asserted, directRelations, unresolvedRelations }
}
