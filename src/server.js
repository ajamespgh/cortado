import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { createChangeSet, createWorkspace } from "./model.js";

const port = Number(process.env.PORT ?? 4317);
const uiPath = path.resolve("public/index.html");
const eventClients = new Set();
const ignoredDirectories = new Set(["node_modules", ".next", ".git"]);

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body));
}

async function workspaceContents(root) {
  const files = [];
  const folders = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
      if (entry.isDirectory()) {
        folders.push({ path: relative, name: entry.name, kind: "folder" });
        await visit(absolute);
      } else {
        files.push({ path: relative, name: entry.name, kind: "file", editable: isTextFile(entry.name) });
      }
    }
  }
  await visit(root);
  return {
    root,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    folders: folders.sort((a, b) => a.path.localeCompare(b.path))
  };
}

function isTextFile(file) {
  return /\.(c|m)?(ts|tsx|js|jsx|json|css|scss|less|md|mdx|html|yml|yaml|txt|xml|svg|gitignore|env|toml|ini|lock)$/i.test(file) || !path.extname(file);
}

async function openWorkspace(root) {
  const stats = await fs.stat(root);
  if (!stats.isDirectory()) throw new Error("Workspace path is not a directory");
  return workspaceContents(root);
}

async function analyze(root) {
  const configPaths = await discoverProjectConfigs(root);
  if (!configPaths.length) throw new Error("No tsconfig.json found in workspace");
  const analyses = configPaths.map((configPath) => analyzeProject(root, configPath));
  const completed = analyses.filter((analysis) => analysis.status === "ready");
  const files = [...new Set(completed.flatMap((analysis) => analysis.files))].sort();
  const nodes = files.map((file) => ({ id: file, kind: "file" }));
  const edges = uniqueBy(completed.flatMap((analysis) => analysis.edges), (edge) => `${edge.from}:${edge.to}:${edge.kind}`);
  const symbols = completed.flatMap((analysis) => analysis.symbols);
  const diagnostics = analyses.flatMap((analysis) => analysis.diagnostics);
  const workspace = createWorkspace({
    root,
    files: nodes.map(({ id, ...file }) => ({ ...file, id, path: id })),
    modules: nodes.map(({ id }) => ({ id, path: id, kind: "module" })),
    symbols,
    relationships: edges.map((edge) => ({ source: edge.from, target: edge.to, type: edge.kind })),
    diagnostics,
    projects: analyses.map(({ configPath, files: projectFiles, status, diagnostics: projectDiagnostics }) => ({
      id: configPath,
      configPath,
      files: projectFiles,
      status,
      diagnostics: projectDiagnostics,
    })),
  });
  return { ...workspace, root, nodes, edges, symbols };
}

async function discoverProjectConfigs(root) {
  const configs = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) await visit(path.join(directory, entry.name));
      } else if (entry.name === "tsconfig.json") {
        configs.push(path.relative(root, path.join(directory, entry.name)).replaceAll(path.sep, "/"));
      }
    }
  }
  await visit(root);
  return configs.sort();
}

function analyzeProject(root, relativeConfigPath) {
  const configPath = path.join(root, relativeConfigPath);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) {
    const diagnostic = { severity: "error", message: ts.flattenDiagnosticMessageText(config.error.messageText, "\n"), code: config.error.code, project: relativeConfigPath };
    return { configPath: relativeConfigPath, files: [], edges: [], symbols: [], diagnostics: [diagnostic], status: "error" };
  }
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const absoluteFiles = parsed.fileNames.filter((file) => /\.(tsx?|jsx?)$/.test(file));
  const files = absoluteFiles.map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
  const edges = [];
  const symbols = [];
  const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()].map((diagnostic) => {
    const file = diagnostic.file;
    const start = diagnostic.start ?? 0;
    const length = diagnostic.length ?? 0;
    const position = file?.getLineAndCharacterOfPosition(start);
    const relativeFile = file ? path.relative(root, file.fileName) : undefined;
    const projectFile = relativeFile && !relativeFile.startsWith("..") && !path.isAbsolute(relativeFile);
    return {
      severity: diagnostic.category === ts.DiagnosticCategory.Error ? "error" : "warning",
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      code: diagnostic.code,
      project: relativeConfigPath,
      location: projectFile && position ? { file: relativeFile, start: { line: position.line + 1, column: position.character + 1 }, end: { line: position.line + 1, column: position.character + length + 1 } } : undefined
    };
  });

  for (const sourceFile of program.getSourceFiles()) {
    if (!absoluteFiles.includes(sourceFile.fileName)) continue;
    const from = path.relative(root, sourceFile.fileName).replaceAll(path.sep, "/");
    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const target = ts.resolveModuleName(statement.moduleSpecifier.text, sourceFile.fileName, parsed.options, ts.sys).resolvedModule?.resolvedFileName;
        if (target && absoluteFiles.includes(target)) edges.push({ from, to: path.relative(root, target).replaceAll(path.sep, "/"), kind: "import" });
      }
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        const symbol = checker.getSymbolAtLocation(statement.name);
        const start = sourceFile.getLineAndCharacterOfPosition(statement.name.getStart());
        const end = sourceFile.getLineAndCharacterOfPosition(statement.name.getEnd());
        symbols.push({ name: statement.name.text, file: from, start: { line: start.line + 1, column: start.character + 1 }, end: { line: end.line + 1, column: end.character + 1 }, exported: Boolean(statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)), references: symbol ? checker.getReferencesAtLocation?.(statement.name) ?? [] : [] });
      }
    }
  }
  const publicSymbols = symbols.map(({ references, start, end, ...symbol }) => ({ ...symbol, project: relativeConfigPath, location: { file: symbol.file, start, end }, referenceCount: references.length }));
  return { configPath: relativeConfigPath, files, edges: uniqueBy(edges, (edge) => `${edge.from}:${edge.to}:${edge.kind}`), symbols: publicSymbols, diagnostics, status: "ready" };
}

function uniqueBy(items, key) {
  return items.filter((item, index) => items.findIndex((candidate) => key(candidate) === key(item)) === index);
}

function createRenameService(root, relativeConfigPath) {
  const configPath = path.join(root, relativeConfigPath);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
  const files = parsed.fileNames;
  const versions = new Map(files.map((file) => [file, "0"]));
  const host = {
    getScriptFileNames: () => files,
    getScriptVersion: (file) => versions.get(file) ?? "0",
    getScriptSnapshot: (file) => ts.sys.fileExists(file) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(file) ?? "") : undefined,
    getCurrentDirectory: () => root,
    getCompilationSettings: () => parsed.options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists, readFile: ts.sys.readFile, readDirectory: ts.sys.readDirectory
  };
  const service = ts.createLanguageService(host);
  return { files, service };
}

async function planRename(root, oldName, newName, sourceFile) {
  const requestedFile = sourceFile && path.resolve(root, sourceFile);
  if (sourceFile && (!requestedFile.startsWith(`${root}${path.sep}`) || path.isAbsolute(sourceFile))) throw new Error("Invalid source file");
  const candidateConfigs = await discoverProjectConfigs(root);
  const candidates = candidateConfigs.map((configPath) => ({ configPath, ...createRenameService(root, configPath) }))
    .filter((candidate) => !requestedFile || candidate.files.includes(requestedFile));
  const declarations = candidates.flatMap((candidate) => candidate.files.map((file) => ({ file, source: candidate.service.getProgram()?.getSourceFile(file), candidate }))
    .flatMap(({ file, source, candidate }) => source ? [ts.forEachChild(source, (node) => ts.isFunctionDeclaration(node) && node.name?.text === oldName ? { file, node, candidate } : undefined)] : [])
    .filter(Boolean));
  if (!sourceFile && declarations.length > 1) throw new Error(`Rename ${oldName} is ambiguous across projects; select its source file`);
  const declaration = declarations[0];
  if (!declaration) throw new Error(`Could not find exported function ${oldName}`);
  const { service, files } = declaration.candidate;
  const position = declaration.node.name.getStart();
  const locations = service.findRenameLocations(declaration.file, position, false, false, {}) ?? [];
  const locationsByFile = new Map();
  for (const location of locations) {
    const list = locationsByFile.get(location.fileName) ?? [];
    list.push(location.textSpan);
    locationsByFile.set(location.fileName, list);
  }
  const changes = [];
  for (const [file, spans] of locationsByFile) {
    const before = await fs.readFile(file, "utf8");
    let after = before;
    for (const span of spans.sort((a, b) => b.start - a.start)) after = after.slice(0, span.start) + newName + after.slice(span.start + span.length);
    changes.push({ file: path.relative(root, file), before, after, replacements: spans.length });
  }
  const changeSet = createChangeSet({
    id: `rename:${oldName}:${newName}`,
    sourceVersion: "filesystem-content",
    changes: changes.map((change) => ({
      ...change,
      edits: locationsByFile.get(path.resolve(root, change.file)).map((span) => ({ start: span.start, length: span.length }))
    }))
  });
  return { ...changeSet, oldName, newName, sourceFile, project: declaration.candidate.configPath, referenceCount: locations.length };
}

async function applyRename(root, input) {
  for (const change of input.changes ?? []) {
    const file = path.resolve(root, change.file);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error("Invalid change path");
    const current = await fs.readFile(file, "utf8");
    if (current !== change.before) throw new Error(`File changed since preview: ${change.file}`);
  }
  for (const change of input.changes) await fs.writeFile(path.resolve(root, change.file), change.after);
  return { appliedFiles: input.changes.map((change) => change.file), referenceCount: input.referenceCount };
}

async function saveFile(root, relative, content, expectedContent) {
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) throw new Error("Invalid project-relative path");
  if (typeof content !== "string") throw new Error("File content must be text");
  const file = path.join(root, relative);
  const current = await fs.readFile(file, "utf8");
  if (expectedContent !== undefined && current !== expectedContent) throw new Error(`File changed since it was opened: ${relative}`);
  await fs.writeFile(file, content, "utf8");
  return { path: relative, content };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const requestedRoot = url.searchParams.get("root");
    const root = requestedRoot ? path.resolve(requestedRoot) : null;
    if (req.method === "OPTIONS") return json(res, 204, {});
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(await fs.readFile(uiPath, "utf8"));
    }
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", "connection": "keep-alive", "access-control-allow-origin": "*" });
      res.write("event: ready\ndata: {}\n\n");
      eventClients.add(res);
      req.on("close", () => eventClients.delete(res));
      return;
    }
    if (req.method === "GET" && url.pathname === "/workspace") {
      if (!root) throw new Error("Workspace path is required");
      return json(res, 200, await openWorkspace(root));
    }
    if (req.method === "GET" && url.pathname === "/analyze") {
      if (!root) throw new Error("No workspace is open");
      return json(res, 200, await analyze(root));
    }
    if (req.method === "GET" && url.pathname === "/file") {
      const relative = url.searchParams.get("path");
      if (!relative || relative.includes("..") || path.isAbsolute(relative)) throw new Error("Invalid project-relative path");
      const file = path.join(root, relative);
      return json(res, 200, { path: relative, content: await fs.readFile(file, "utf8") });
    }
    if (req.method === "PUT" && url.pathname === "/file") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const input = JSON.parse(body);
      return json(res, 200, await saveFile(root, input.path, input.content, input.expectedContent));
    }
    if (req.method === "POST" && url.pathname === "/rename") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const input = JSON.parse(body);
      return json(res, 200, await planRename(root, input.oldName, input.newName, input.sourceFile));
    }
    if (req.method === "POST" && url.pathname === "/rename/apply") {
      let body = "";
      for await (const chunk of req) body += chunk;
      return json(res, 200, await applyRename(root, JSON.parse(body)));
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) { return json(res, 400, { error: error.message }); }
});

export { analyze, openWorkspace, planRename, applyRename, saveFile, workspaceContents };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  server.listen(port, "127.0.0.1", () => console.log(`Cortado service listening on http://127.0.0.1:${port}`));
}
