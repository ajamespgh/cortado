import path from "node:path";

const uriScheme = "cortado";

function assertProjectRelative(value, label = "path") {
  if (typeof value !== "string" || !value || path.isAbsolute(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error(`${label} must be a non-empty project-relative path`);
  }
  return value.replaceAll("\\", "/");
}

export function resourceUri(projectPath) {
  return `${uriScheme}:/${assertProjectRelative(projectPath)}`;
}

export function createLocation(file, start, end = start) {
  return { file: assertProjectRelative(file, "location file"), start, end };
}

export function createWorkspace({ root, files = [], modules = [], symbols = [], relationships = [], diagnostics = [] }) {
  return {
    kind: "workspace",
    root,
    files: files.map((file) => ({ ...file, path: assertProjectRelative(file.path) })),
    modules,
    symbols: symbols.map((symbol) => ({ ...symbol, location: createLocation(symbol.location.file, symbol.location.start, symbol.location.end) })),
    relationships,
    diagnostics: diagnostics.map((diagnostic) => ({ ...diagnostic, ...(diagnostic.location?.file ? { location: createLocation(diagnostic.location.file, diagnostic.location.start, diagnostic.location.end) } : {}) })),
  };
}

export function createChangeSet({ id, changes = [], sourceVersion }) {
  if (!id) throw new Error("change set id is required");
  return {
    kind: "change-set",
    id,
    sourceVersion,
    changes: changes.map((change) => ({
      file: assertProjectRelative(change.file, "change file"),
      edits: [...change.edits].sort((a, b) => b.start - a.start),
      before: change.before,
      after: change.after,
    })),
  };
}

export { assertProjectRelative };
