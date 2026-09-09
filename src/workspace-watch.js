import fs from "node:fs";
import path from "node:path";

const ignored = new Set(["node_modules", ".git", ".next", "dist"]);

function projectPath(root, filename) {
  if (!filename) return undefined;
  const relative = path.relative(root, path.resolve(root, filename));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return undefined;
  if (relative.split(path.sep).some((part) => ignored.has(part))) return undefined;
  return relative.replaceAll(path.sep, "/");
}

export function watchWorkspace(root, onChange, { debounceMs = 75 } = {}) {
  let timer;
  const pending = new Map();
  const watcher = fs.watch(root, { recursive: true }, (eventType, filename) => {
    const file = projectPath(root, filename?.toString());
    if (!file) return;
    pending.set(file, eventType);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const changes = [...pending].map(([path, type]) => ({ path, type }));
      pending.clear();
      onChange(changes);
    }, debounceMs);
  });
  return () => { clearTimeout(timer); pending.clear(); watcher.close(); };
}

