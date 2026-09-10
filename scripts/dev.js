import { spawn } from "node:child_process";
import process from "node:process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const openBrowser = !process.argv.includes("--no-open");
const children = [];
let shuttingDown = false;

function start(name, args) {
  const child = spawn(npm, args, {
    stdio: "inherit",
    env: process.env
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const result = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`${name} stopped (${result}); stopping Cortado development session.`);
    shutdown(code ?? 1);
  });
  child.on("error", (error) => {
    console.error(`Unable to start ${name}: ${error.message}`);
    shutdown(1);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting Cortado service on http://127.0.0.1:4317");
console.log("Starting Cortado UI on http://localhost:5173");
console.log("Press Ctrl+C to stop both processes.");

start("Cortado service", ["run", "start"]);
start("Cortado UI", ["run", "ui", ...(openBrowser ? ["--", "--open"] : [])]);
