import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position } from "@xyflow/react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { FiFolder, FiFolderPlus, FiFileText } from "react-icons/fi";
import { SiTypescript, SiJavascript, SiReact, SiJson, SiCss, SiMarkdown } from "react-icons/si";
import "@xyflow/react/dist/style.css";
import "./style.css";

async function request(path, options) {
  const response = await fetch(path, options);
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Service returned invalid JSON (${response.status})`); }
  if (!response.ok) throw new Error(data.error || `Service request failed (${response.status})`);
  return data;
}

const query = (root, extra = "") => `?root=${encodeURIComponent(root)}${extra}`;
const fileName = (value) => value.split("/").at(-1);
const language = (value) => ({ ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", json: "json", css: "css", md: "markdown", html: "html", svg: "xml" }[value.split(".").at(-1)?.toLowerCase()] || "plaintext");

function CompactNode({ data }) {
  return <div className="compact-node" title={data.title} aria-label={data.title}><Handle id="top-target" type="target" position={Position.Top} /><Handle id="right-target" type="target" position={Position.Right} /><Handle id="bottom-target" type="target" position={Position.Bottom} /><Handle id="left-target" type="target" position={Position.Left} /><span className="node-icon"><NodeIcon kind={data.kind} /></span><Handle id="top-source" type="source" position={Position.Top} /><Handle id="right-source" type="source" position={Position.Right} /><Handle id="bottom-source" type="source" position={Position.Bottom} /><Handle id="left-source" type="source" position={Position.Left} /></div>;
}

function NodeIcon({ kind }) {
  const props = { size: 18, "aria-hidden": true };
  if (kind === "root") return <FiFolderPlus {...props} />;
  if (kind === "folder") return <FiFolder {...props} />;
  if (kind === "typescript" || kind === "tsx") return kind === "tsx" ? <SiReact {...props} /> : <SiTypescript {...props} />;
  if (kind === "javascript" || kind === "jsx") return kind === "jsx" ? <SiReact {...props} /> : <SiJavascript {...props} />;
  if (kind === "json") return <SiJson {...props} />;
  if (kind === "css") return <SiCss {...props} />;
  if (kind === "markdown") return <SiMarkdown {...props} />;
  return <FiFileText {...props} />;
}

const nodeTypes = { compact: CompactNode };

function conceptMapLayout(items) {
  const root = items[0];
  const byDepth = new Map([[root.id, 0]]);
  const parentOf = new Map(items.slice(1).map((item) => [item.id, item.path.includes("/") ? `workspace:${item.path.slice(0, item.path.lastIndexOf("/"))}` : "workspace:."]));
  const depthOf = (id) => {
    if (byDepth.has(id)) return byDepth.get(id);
    const depth = 1 + depthOf(parentOf.get(id));
    byDepth.set(id, depth);
    return depth;
  };
  items.slice(1).forEach((item) => depthOf(item.id));
  const levels = new Map();
  items.forEach((item) => { const level = levels.get(byDepth.get(item.id)) || []; level.push(item); levels.set(byDepth.get(item.id), level); });
  const positions = new Map([[root.id, { x: 0, y: 0 }]]);
  const children = new Map();
  parentOf.forEach((parent, child) => { const list = children.get(parent) || []; list.push(child); children.set(parent, list); });
  const subtreeSize = (id) => 1 + (children.get(id) || []).reduce((total, child) => total + subtreeSize(child), 0);
  const place = (parent, centerAngle, arc, distance) => {
    const descendants = children.get(parent) || [];
    const totalWeight = descendants.reduce((total, child) => total + subtreeSize(child), 0);
    let cursor = centerAngle - arc / 2;
    descendants.forEach((child) => {
      const childArc = arc * (subtreeSize(child) / totalWeight);
      const childAngle = cursor + childArc / 2;
      const point = positions.get(parent) || { x: 0, y: 0 };
      positions.set(child, { x: point.x + Math.cos(childAngle) * distance, y: point.y + Math.sin(childAngle) * distance });
      place(child, childAngle, Math.max(childArc * 0.82, 0.24), Math.max(120, distance - 35));
      cursor += childArc;
    });
  };
  place(root.id, -Math.PI / 2, Math.PI * 2, 300);
  return positions;
}

function nodeIcon(item) {
  if (item.kind === "root") return "◉";
  if (item.kind === "folder") return "▰";
  if (/\.(tsx?|jsx?)$/i.test(item.path)) return "TS";
  if (/\.json$/i.test(item.path)) return "{}";
  if (/\.(css|scss|less)$/i.test(item.path)) return "#";
  if (/\.md$/i.test(item.path)) return "M";
  return "•";
}

function directionalHandles(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? { sourceHandle: "right-source", targetHandle: "left-target" } : { sourceHandle: "left-source", targetHandle: "right-target" };
  return dy >= 0 ? { sourceHandle: "bottom-source", targetHandle: "top-target" } : { sourceHandle: "top-source", targetHandle: "bottom-target" };
}

function Explorer({ workspace, selected, onSelect, collapsed, onToggle }) {
  const [expanded, setExpanded] = useState(new Set(["."]));
  if (collapsed) return null;
  const folders = workspace.folders.filter((item) => item.path.includes("/") || item.path);
  const direct = (parent) => {
    const prefix = parent === "." ? "" : `${parent}/`;
    return {
      folders: folders.filter((item) => item.path.startsWith(prefix) && !item.path.slice(prefix.length).includes("/")),
      files: workspace.files.filter((item) => item.path.startsWith(prefix) && !item.path.slice(prefix.length).includes("/"))
    };
  };
  const toggle = (path) => setExpanded((old) => { const next = new Set(old); next.has(path) ? next.delete(path) : next.add(path); return next; });
  const renderFolder = (folder, depth) => {
    const open = expanded.has(folder.path);
    const children = direct(folder.path);
    return <React.Fragment key={folder.path}><button className="tree-row folder-row" style={{ paddingLeft: 10 + depth * 14 }} onClick={() => toggle(folder.path)}><span>{open ? "⌄" : "›"}</span>{folder.name}</button>{open && <>{children.folders.map((child) => renderFolder(child, depth + 1))}{children.files.map((file) => renderFile(file, depth + 1))}</>}</React.Fragment>;
  };
  const renderFile = (file, depth) => <button className={selected === file.path ? "tree-row selected-file" : "tree-row"} style={{ paddingLeft: 25 + depth * 14 }} onClick={() => onSelect(file.path)} key={file.path}><span className="file-icon">{file.editable ? "◇" : "□"}</span>{fileName(file.path)}</button>;
  const root = { path: ".", name: workspace.root.split(/[\\/]/).at(-1) || workspace.root };
  const children = direct(".");
  return <aside className="explorer"><div className="explorer-title"><strong>Explorer</strong><button className="icon-button" onClick={onToggle}>…</button></div><section className="open-editors"><div className="section-title">⌄ Open Editors</div>{selected && <button className="tree-row editor-row" onClick={() => onSelect(selected)}>◇ {fileName(selected)}</button>}</section><section className="tree"><button className="tree-row root-row" onClick={() => toggle(".")}><span>{expanded.has(".") ? "⌄" : "›"}</span>{root.name}</button>{expanded.has(".") && <>{children.folders.map((folder) => renderFolder(folder, 0))}{children.files.map((file) => renderFile(file, 0))}</>}</section></aside>;
}

function EditorArea({ selected, activeFile, source, savedSource, project, onChange, onSave, onRename }) {
  const diagnostics = project?.diagnostics.filter((item) => item.location?.file === selected) || [];
  return <div className="editor-area"><div className="file-header"><h2>{selected}{source !== savedSource && <small> • unsaved</small>}</h2><div><button onClick={onSave} disabled={source === savedSource || !activeFile?.editable}>Save</button><button onClick={onRename} disabled={!project}>Rename symbol</button></div></div>{diagnostics.map((item) => <div className="diagnostic" key={`${item.code}-${item.location.start.line}`}>{item.severity}: {item.message}</div>)}<Editor height="calc(100vh - 140px)" language={language(selected)} theme="vs-dark" value={source} onChange={(value) => onChange(value ?? "")} options={{ minimap: { enabled: false }, readOnly: !activeFile?.editable }} /></div>;
}

function App() {
  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [rootInput, setRootInput] = useState("");
  const [status, setStatus] = useState("No workspace open");
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState("graph");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [proposal, setProposal] = useState(null);

  async function openWorkspace(root) {
    setStatus("Opening workspace…");
    try {
      const contents = await request(`/workspace${query(root)}`);
      setWorkspace(contents); setProject(null); setSelected(null); setSource(""); setSavedSource("");
      try {
        const analysis = await request(`/analyze${query(root)}`);
        setProject(analysis); setStatus(`${analysis.nodes.length} modules · ${analysis.edges.length} imports${analysis.diagnostics.length ? ` · ${analysis.diagnostics.length} diagnostics` : ""}`);
      } catch (error) { setStatus(`Workspace open; analysis unavailable: ${error.message}`); }
    } catch (error) { setWorkspace(null); setProject(null); setStatus(`No workspace open: ${error.message}`); }
  }

  async function selectFile(file) {
    setSelected(file);
    try { const result = await request(`/file${query(workspace.root, `&path=${encodeURIComponent(file)}`)}`); setSource(result.content); setSavedSource(result.content); }
    catch (error) { setStatus(error.message); }
  }

  async function saveFile() {
    try {
      await request(`/file${query(workspace.root)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: selected, content: source, expectedContent: savedSource }) });
      setSavedSource(source); setStatus(`Saved ${selected}`);
      if (project) setProject(await request(`/analyze${query(workspace.root)}`));
    } catch (error) { setStatus(error.message); }
  }

  async function renameFileSymbol() {
    const symbol = project?.symbols.find((item) => item.file === selected);
    if (!symbol) return setStatus("Select a file containing a supported function symbol");
    const newName = window.prompt(`Rename ${symbol.name} to:`, symbol.name);
    if (!newName || newName === symbol.name) return;
    try { setProposal(await request(`/rename${query(workspace.root)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ oldName: symbol.name, newName }) })); }
    catch (error) { setStatus(error.message); }
  }

  async function applyRename() {
    try { const result = await request(`/rename/apply${query(workspace.root)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(proposal) }); setProposal(null); setStatus(`Applied ${result.referenceCount} references in ${result.appliedFiles.length} files`); await openWorkspace(workspace.root); }
    catch (error) { setStatus(error.message); }
  }

  useEffect(() => {
    const save = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && selected && source !== savedSource) { event.preventDefault(); saveFile(); } };
    window.addEventListener("keydown", save); return () => window.removeEventListener("keydown", save);
  }, [selected, source, savedSource, workspace, project]);

  useEffect(() => {
    if (!workspace) return;
    const all = [{ id: "workspace:.", path: workspace.root.split(/[\\/\\]/).at(-1), kind: "root" }, ...workspace.folders.map((item) => ({ id: `workspace:${item.path}`, path: item.path, kind: "folder" })), ...workspace.files.map((item) => ({ id: `workspace:${item.path}`, path: item.path, kind: "file" }))];
    const positions = conceptMapLayout(all);
    const nextNodes = all.map((item) => ({ id: item.id, position: positions.get(item.id), type: "compact", data: { kind: item.kind === "file" && /\.tsx$/i.test(item.path) ? "tsx" : item.kind === "file" && /\.ts$/i.test(item.path) ? "typescript" : item.kind === "file" && /\.jsx$/i.test(item.path) ? "jsx" : item.kind === "file" && /\.js$/i.test(item.path) ? "javascript" : item.kind === "file" && /\.json$/i.test(item.path) ? "json" : item.kind === "file" && /\.(css|scss|less)$/i.test(item.path) ? "css" : item.kind === "file" && /\.md$/i.test(item.path) ? "markdown" : item.kind, title: item.kind === "root" ? workspace.root : item.path }, style: { background: item.kind === "root" ? "#075985" : item.kind === "folder" ? "#422006" : "#172554", color: "#e5e7eb", border: item.kind === "root" ? "2px solid #fbbf24" : "1px solid #60a5fa", borderRadius: "50%", padding: 3, width: 42, height: 42 } }));
    const handlePair = (source, target) => directionalHandles(positions.get(source) || { x: 0, y: 0 }, positions.get(target) || { x: 0, y: 0 });
    const hierarchy = all.slice(1).map((item) => { const parent = item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "."; const source = `workspace:${parent}`; return { id: `contains:${parent}:${item.path}`, source, target: item.id, type: "default", relationType: "containment", ...handlePair(source, item.id) }; });
    const imports = (project?.edges || []).map((item, index) => { const source = `workspace:${item.from}`; const target = `workspace:${item.to}`; return { id: `import:${index}`, source, target, type: "default", relationType: "import", ...handlePair(source, target) }; });
    setNodes(nextNodes); setEdges([...hierarchy, ...imports]);
  }, [workspace, project]);

  const activeFile = workspace?.files.find((file) => file.path === selected);
  const filteredFiles = useMemo(() => workspace?.files.filter((file) => file.path.toLowerCase().includes(rootInput.toLowerCase())) || [], [workspace, rootInput]);
  const renderedEdges = useMemo(() => edges.map((edge) => ({ ...edge, style: { stroke: edge.relationType === "containment" ? "#fbbf24" : "#93c5fd", strokeDasharray: edge.relationType === "containment" ? "5 4" : undefined } })), [edges]);
  if (!workspace) return <main className="empty-state"><div><h1>Cortado</h1><p>{status}</p><input className="root-input empty-input" placeholder="Enter a workspace path" value={rootInput} onChange={(event) => setRootInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && rootInput.trim() && openWorkspace(rootInput.trim())} /><p className="hint">Open any accessible folder to browse it. TypeScript analysis activates when available.</p></div></main>;
  return <main><header><strong>Cortado</strong><span className="workspace-label">{workspace.root}</span><span className="status">{status}</span><button onClick={() => openWorkspace(workspace.root)}>Refresh</button></header><section className="shell"><nav className="activity-bar"><button className={view === "explorer" ? "activity active" : "activity"} onClick={() => { setView("explorer"); setCollapsed(false); }} aria-label="Explorer">▣</button><button className={view === "graph" ? "activity active" : "activity"} onClick={() => setView("graph")} aria-label="Graph">⌘</button><button className="activity" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle explorer">◧</button></nav>{view === "explorer" && <Explorer workspace={workspace} selected={selected} onSelect={selectFile} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />}<section className="content"><div className="workspace-path"><input aria-label="Workspace path" placeholder="Workspace path" value={rootInput} onChange={(event) => setRootInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && rootInput.trim() && openWorkspace(rootInput.trim())} /><button onClick={() => rootInput.trim() && openWorkspace(rootInput.trim())}>Open</button></div>{view === "graph" ? <div className="graph"><ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={renderedEdges} fitView onNodesChange={(changes) => setNodes((current) => current.map((node) => { const change = changes.find((item) => item.id === node.id && item.type === "position" && item.position); return change ? { ...node, position: change.position } : node; }))} onNodeClick={(_, node) => node.id !== "workspace:." && selectFile(node.id.replace("workspace:", ""))}><Background /><Controls /></ReactFlow></div> : selected ? <EditorArea selected={selected} activeFile={activeFile} source={source} savedSource={savedSource} project={project} onChange={setSource} onSave={saveFile} onRename={renameFileSymbol} /> : <div className="no-selection"><p>Select a file from the Explorer.</p><p>{filteredFiles.length} files available in this workspace.</p></div>}{proposal && <div className="proposal"><h2>Review rename</h2>{proposal.changes.map((change) => <div key={change.file}><strong>{change.file}</strong><DiffEditor height="180px" language="typescript" theme="vs-dark" original={change.before} modified={change.after} options={{ readOnly: true, minimap: { enabled: false } }} /></div>)}<button onClick={applyRename}>Apply changes</button><button className="cancel" onClick={() => setProposal(null)}>Cancel</button></div>}</section></section></main>;
}

createRoot(document.getElementById("root")).render(<App />);
