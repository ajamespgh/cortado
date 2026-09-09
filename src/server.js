import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { createChangeSet, createWorkspace } from "./model.js";

const port = Number(process.env.PORT ?? 4317);
const defaultRoot = path.resolve("fixtures/reference-next-app");
const uiPath = path.resolve("public/index.html");

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body));
}

async function projectFiles(root) {
  const result = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) result.push(absolute);
    }
  }
  await visit(root);
  return result.sort();
}

async function analyze(root) {
  const configPath = path.join(root, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const files = parsed.fileNames.filter((file) => /\.(tsx?|jsx?)$/.test(file));
  const nodes = files.map((file) => ({ id: path.relative(root, file), kind: "file" }));
  const edges = [];
  const symbols = [];

  for (const sourceFile of program.getSourceFiles()) {
    if (!files.includes(sourceFile.fileName)) continue;
    const from = path.relative(root, sourceFile.fileName);
    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const target = ts.resolveModuleName(statement.moduleSpecifier.text, sourceFile.fileName, parsed.options, ts.sys).resolvedModule?.resolvedFileName;
        if (target && files.includes(target)) edges.push({ from, to: path.relative(root, target), kind: "import" });
      }
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        const symbol = checker.getSymbolAtLocation(statement.name);
        symbols.push({ name: statement.name.text, file: from, line: sourceFile.getLineAndCharacterOfPosition(statement.name.getStart()).line + 1, exported: Boolean(statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)), references: symbol ? checker.getReferencesAtLocation?.(statement.name) ?? [] : [] });
      }
    }
  }
  const uniqueEdges = edges.filter((edge, index, all) => all.findIndex((item) => item.from === edge.from && item.to === edge.to) === index);
  const publicSymbols = symbols.map(({ references, line, ...symbol }) => ({ ...symbol, location: { file: symbol.file, start: { line, column: 1 }, end: { line, column: 1 } }, referenceCount: references.length }));
  const workspace = createWorkspace({
    root,
    files: nodes.map(({ id, ...file }) => ({ ...file, id, path: id })),
    modules: nodes.map(({ id }) => ({ id, path: id, kind: "module" })),
    symbols: publicSymbols,
    relationships: uniqueEdges.map((edge) => ({ source: edge.from, target: edge.to, type: edge.kind }))
  });
  return { ...workspace, root, nodes, edges: uniqueEdges, symbols: publicSymbols };
}

async function planRename(root, oldName, newName) {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
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
  const declaration = files.map((file) => ({ file, source: service.getProgram()?.getSourceFile(file) })).flatMap(({ file, source }) => source ? [ts.forEachChild(source, (node) => ts.isFunctionDeclaration(node) && node.name?.text === oldName ? { file, node } : undefined)] : []).find(Boolean);
  if (!declaration) throw new Error(`Could not find exported function ${oldName}`);
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
  return { ...changeSet, oldName, newName, referenceCount: locations.length };
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
    const root = path.resolve(url.searchParams.get("root") ?? defaultRoot);
    if (req.method === "OPTIONS") return json(res, 204, {});
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(await fs.readFile(uiPath, "utf8"));
    }
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/analyze") return json(res, 200, await analyze(root));
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
      return json(res, 200, await planRename(root, input.oldName, input.newName));
    }
    if (req.method === "POST" && url.pathname === "/rename/apply") {
      let body = "";
      for await (const chunk of req) body += chunk;
      return json(res, 200, await applyRename(root, JSON.parse(body)));
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) { return json(res, 400, { error: error.message }); }
});

export { analyze, planRename, applyRename, saveFile };

if (process.argv[1] === new URL(import.meta.url).pathname) server.listen(port, "127.0.0.1", () => console.log(`Cortado service listening on http://127.0.0.1:${port}`));
