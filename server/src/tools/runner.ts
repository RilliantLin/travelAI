import { spawn } from "child_process";
import { AppError } from "../contracts/errors";

export interface ToolRunResult {
  command: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export function runCliTool(command: string[], cwd = process.cwd()): Promise<ToolRunResult> {
  return new Promise((resolve, reject) => {
    if (command.length === 0) {
      reject(new AppError("INVALID_ARGUMENT", "命令不能为空", 2, 400));
      return;
    }

    const child = spawn(command[0], command.slice(1), {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => reject(error));
    child.on("close", (exitCode) => {
      resolve({ command, exitCode, stdout, stderr });
    });
  });
}

