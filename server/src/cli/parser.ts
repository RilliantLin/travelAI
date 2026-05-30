import { AppError } from "../contracts/errors";

export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const raw = arg.slice(2);
      const [key, inlineValue] = raw.split("=", 2);

      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
        continue;
      }

      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    positional.push(arg);
  }

  return { positional, flags };
}

export function getStringFlag(flags: ParsedArgs["flags"], key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

export function getNumberFlag(flags: ParsedArgs["flags"], key: string): number | undefined {
  const value = getStringFlag(flags, key);
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError("INVALID_ARGUMENT", `--${key} 必须是数字`, 2, 400);
  }
  return parsed;
}

export function getBooleanFlag(flags: ParsedArgs["flags"], key: string): boolean {
  const value = flags[key];
  return value === true || value === "true" || value === "1" || value === "yes";
}

export function getRequired(value: string | undefined, label: string): string {
  if (!value) {
    throw new AppError("INVALID_ARGUMENT", `缺少参数：${label}`, 2, 400);
  }
  return value;
}

export function parseJsonValue(value: string | undefined, label: string): unknown {
  if (!value) {
    throw new AppError("INVALID_ARGUMENT", `缺少参数：${label}`, 2, 400);
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new AppError("INVALID_ARGUMENT", `${label} 必须是合法 JSON`, 2, 400);
  }
}

export function parseJsonFlag(flags: ParsedArgs["flags"], key: string): unknown {
  const value = getStringFlag(flags, key);
  if (value === undefined) return undefined;
  return parseJsonValue(value, `--${key}`);
}

