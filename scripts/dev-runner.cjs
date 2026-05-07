const { execSync, spawn } = require("node:child_process");
const path = require("node:path");

const root = process.cwd();
const children = [];
let shuttingDown = false;
const portsToFree = [5173, 4000];

function freePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString();

    const pids = Array.from(
      new Set(
        output
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.split(/\s+/).at(-1))
          .filter((value) => value && value !== "0")
      )
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, {
          cwd: root,
          stdio: ["ignore", "ignore", "ignore"]
        });
        process.stdout.write(`Freed port ${port} by stopping PID ${pid}.\n`);
      } catch {
        // Ignore processes that may already be closed between lookup and kill.
      }
    }
  } catch {
    // No process is using this port.
  }
}

function startWorkspace(name, color, script) {
  const child = spawn("npm.cmd", ["run", script, "--workspace", name], {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    env: process.env
  });

  const prefix = colorize(`[${name}]`, color);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(prefixLines(prefix, chunk.toString()));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(prefixLines(prefix, chunk.toString()));
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    process.stderr.write(`${prefix} exited with ${reason}\n`);

    if (!shuttingDown) {
      shutdown(code ?? 1);
    }
  });

  children.push(child);
}

function prefixLines(prefix, text) {
  return text
    .split(/\r?\n/)
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1)
    .map((line) => `${prefix} ${line}\n`)
    .join("");
}

function colorize(label, color) {
  const colors = {
    cyan: "\u001b[36m",
    magenta: "\u001b[35m",
    reset: "\u001b[0m"
  };

  return `${colors[color] || ""}${label}${colors.reset}`;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(exitCode), 150);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.stdout.write("Starting ClearAller Vision frontend and backend...\n");
for (const port of portsToFree) {
  freePort(port);
}
startWorkspace("backend", "cyan", "dev");
startWorkspace("frontend", "magenta", "dev");
