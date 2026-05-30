import { CliOutput } from "../contracts/cli-output";
import { AppError, toAppError } from "../contracts/errors";

export function writeSuccess(data: unknown): void {
  const output: CliOutput = { ok: true, data };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

export function writeJsonLine(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

export function writeError(error: unknown): void {
  const appError = toAppError(error);
  const output: CliOutput = {
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    },
  };

  process.stderr.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exitCode = appError.exitCode;
}

export function assertNever(value: never): never {
  throw new AppError("INVALID_ARGUMENT", `未知命令：${String(value)}`, 2, 400);
}

