import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import "@xyflow/react/dist/style.css";
import "./style.css";

const SERVICE = "";

async function request(path, options) {
  const response = await fetch(`${SERVICE}${path}`, options);
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Service returned invalid JSON (${response.status})`); }
  if (!response.ok) throw new Error(data.error || `Service request failed (${response.status})`);
  return data;
}

function App() {
  const [project, setProject] = useState(null);
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [status, setStatus] = useState("Loading analysis…");
  const [proposal, setProposal] = useState(null);
  const [proposalFile, setProposalFile] = useState(null);

  async function analyze() {
    const data = await request("/analyze");
    setProject(data);
    setStatus(`${data.nodes.length} modules · ${data.edges.length} imports`);
  }

  useEffect(() => { analyze().catch(error => setStatus(error.message)); }, []);

  async function selectFile(file) {
    setSelected(file);
    const data = await request(`/file?path=${encodeURIComponent(file)}`);
    setSource(data.content);
    setSavedSource(data.content);
  }

  async function rename() {
    const symbol = project.symbols.find(item => item.file === selected);
    if (!symbol) return;
    const newName = window.prompt(`Rename ${symbol.name} to:`, symbol.name === "getProjects" ? "listProjects" : symbol.name);
    if (!newName || newName === symbol.name) return;
    let result;
    try { result = await request("/rename", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ oldName: symbol.name, newName }) }); }
    catch (error) { return setStatus(error.message); }
    setProposal(result);
    setProposalFile(result.changes[0] ?? null);
    setStatus(`Rename proposed: ${result.referenceCount} references in ${result.changes.length} files`);
  }

  async function applyProposal() {
    const result = await request("/rename/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(proposal) });
    setProposal(null);
    setProposalFile(null);
    setStatus(`Applied ${result.referenceCount} references in ${result.appliedFiles.length} files`);
    await analyze();
    await selectFile(selected);
  }

  async function saveSource() {
    try {
      await request("/file", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: selected, content: source, expectedContent: savedSource }) });
      setSavedSource(source);
      setStatus(`Saved ${selected}`);
      await analyze();
    } catch (error) { setStatus(error.message); }
  }

  if (!project) return <main className="loading">{status}</main>;
  const nodes = project.nodes.map((node, index) => ({ id: node.id, position: { x: (index % 3) * 260 + 30, y: Math.floor(index / 3) * 130 + 30 }, data: { label: node.id }, style: { background: node.id.includes("api/") ? "#422006" : "#172554", color: "#e5e7eb", border: "1px solid #60a5fa", borderRadius: 8, padding: 12, width: 210 } }));
  const edges = project.edges.map((edge, index) => ({ id: `${edge.from}-${edge.to}-${index}`, source: edge.from, target: edge.to, animated: edge.from === selected, style: { stroke: "#93c5fd" } }));

  return <main>
    <header><strong>Cortado</strong><span>{status}</span><button onClick={analyze}>Refresh</button></header>
    <section className="workspace">
      <div className="graph"><ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={(_, node) => selectFile(node.id)}><Background /><Controls /><MiniMap /></ReactFlow></div>
      <aside>
        {proposal && <div className="proposal"><h2>Review rename</h2><div className="change-list">{proposal.changes.map(change => <button className={proposalFile?.file === change.file ? "change selected-change" : "change"} onClick={() => setProposalFile(change)} key={change.file}>{change.file}<span>{change.replacements} replacements</span></button>)}</div>{proposalFile && <DiffEditor height="360px" language="typescript" theme="vs-dark" original={proposalFile.before} modified={proposalFile.after} options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false } }} />}<button onClick={applyProposal}>Apply changes</button> <button className="cancel" onClick={() => { setProposal(null); setProposalFile(null); setStatus("Rename cancelled"); }}>Cancel</button></div>}
        {selected ? <><div className="file-header"><h2>{selected}{source !== savedSource && <small> • unsaved</small>}</h2><div><button onClick={saveSource} disabled={source === savedSource}>Save</button> <button onClick={rename}>Rename symbol</button></div></div><Editor height="calc(100vh - 110px)" language="typescript" theme="vs-dark" value={source} onChange={(value) => setSource(value ?? "")} options={{ minimap: { enabled: false } }} /></> : <p>Select a module to inspect its source.</p>}
      </aside>
    </section>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
