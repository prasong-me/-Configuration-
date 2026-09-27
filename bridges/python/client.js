import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const bridgePath = fileURLToPath(new URL("./bridge.py", import.meta.url));

export function exchangeWithPythonBridge(envelope, options = {}) {
  const python = options.python ?? "python3";
  const result = spawnSync(python, [bridgePath], {
    input: JSON.stringify(envelope) + "\n",
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || "Python bridge exited with non-zero status.");
  }

  const line = result.stdout.trim();
  if (!line) throw new Error("Python bridge returned no response.");
  return JSON.parse(line);
}