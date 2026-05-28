#!/usr/bin/env node

process.env.TRAVEL_CLI = "true";

import "../config/env";
import prisma from "../config/database";
import { closeRedis } from "../config/redis";
import { createPlanStream, runPlanChat } from "../services/plan.service";
import {
  deleteItineraryById,
  getItineraryById,
  listItineraries,
  updateItineraryMeta,
} from "../services/itinerary.service";
import {
  deletePreferenceByUserId,
  getPreferenceByUserId,
  upsertPreference,
} from "../services/preference.service";

type CliErrorCode =
  | "COMMAND_ERROR"
  | "INVALID_ARGUMENT"
  | "ITINERARY_NOT_FOUND"
  | "PREFERENCE_NOT_FOUND"
  | "USER_NOT_FOUND";

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

class CliError extends Error {
  constructor(
    public code: CliErrorCode,
    message: string,
    public exitCode: number = 1
  ) {
    super(message);
  }
}

function parseArgs(args: string[]): ParsedArgs {
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

function getStringFlag(flags: ParsedArgs["flags"], key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

function getRequired(value: string | undefined, label: string): string {
  if (!value) {
    throw new CliError("INVALID_ARGUMENT", `缺少参数：${label}`);
  }
  return value;
}

function parseJsonFlag(flags: ParsedArgs["flags"], key: string): unknown {
  const value = getStringFlag(flags, key);
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new CliError("INVALID_ARGUMENT", `--${key} 必须是合法 JSON`);
  }
}

function parsePreferenceInput(flags: ParsedArgs["flags"]): Record<string, unknown> {
  const jsonInput = parseJsonFlag(flags, "data");
  if (jsonInput !== undefined) {
    if (!jsonInput || typeof jsonInput !== "object" || Array.isArray(jsonInput)) {
      throw new CliError("INVALID_ARGUMENT", "--data 必须是 JSON 对象");
    }
    return jsonInput as Record<string, unknown>;
  }

  const input: Record<string, unknown> = {};
  const numericFields = ["budgetMin", "budgetMax", "travelerCount"];
  const stringFields = ["currency", "travelStyle", "transportPreference", "accommodationType"];
  const arrayFields = ["dietaryRestrictions", "preferredActivities"];

  for (const field of numericFields) {
    const value = getStringFlag(flags, field);
    if (value !== undefined) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        throw new CliError("INVALID_ARGUMENT", `--${field} 必须是数字`);
      }
      input[field] = numberValue;
    }
  }

  for (const field of stringFields) {
    const value = getStringFlag(flags, field);
    if (value !== undefined) {
      input[field] = value;
    }
  }

  for (const field of arrayFields) {
    const value = getStringFlag(flags, field);
    if (value !== undefined) {
      input[field] = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (flags.accessibilityNeeds !== undefined) {
    const value = flags.accessibilityNeeds;
    input.accessibilityNeeds =
      value === true || value === "true" || value === "1" || value === "yes";
  }

  return input;
}

function writeSuccess(data: unknown): void {
  process.stdout.write(`${JSON.stringify({ ok: true, data }, null, 2)}\n`);
}

function writeError(error: unknown): void {
  const cliError =
    error instanceof CliError
      ? error
      : new CliError(
          "COMMAND_ERROR",
          error instanceof Error ? error.message : "命令执行失败"
        );

  process.stderr.write(
    `${JSON.stringify(
      {
        ok: false,
        error: {
          code: cliError.code,
          message: cliError.message,
        },
      },
      null,
      2
    )}\n`
  );
  process.exitCode = cliError.exitCode;
}

function printHelp(): void {
  writeSuccess({
    usage: "travel <plan|preference> <command> [args] [--flags]",
    commands: [
      "plan list [--userId <userId>]",
      "plan get <itineraryId>",
      "plan update <itineraryId> [--title <title>] [--description <description>] [--status <status>]",
      "plan delete <itineraryId>",
      "plan chat <itineraryId|new> <message> [--userId <userId>] [--context <text>] [--history <json>] [--stream]",
      "preference get <userId>",
      "preference set <userId> [--data <json>] [--budgetMin <n>] [--budgetMax <n>] [--travelStyle <style>]",
      "preference delete <userId>",
    ],
  });
}

async function handlePlan(args: ParsedArgs): Promise<void> {
  const [command, idOrFirst, ...rest] = args.positional;

  switch (command) {
    case "list": {
      const userId = getStringFlag(args.flags, "userId");
      writeSuccess(await listItineraries(userId));
      return;
    }

    case "get": {
      const id = getRequired(idOrFirst, "itineraryId");
      const itinerary = await getItineraryById(id);
      if (!itinerary) {
        throw new CliError("ITINERARY_NOT_FOUND", "行程不存在", 2);
      }
      writeSuccess(itinerary);
      return;
    }

    case "update": {
      const id = getRequired(idOrFirst, "itineraryId");
      const data = {
        title: getStringFlag(args.flags, "title"),
        description: getStringFlag(args.flags, "description"),
        status: getStringFlag(args.flags, "status") as
          | "draft"
          | "confirmed"
          | "completed"
          | "cancelled"
          | undefined,
      };
      writeSuccess(await updateItineraryMeta(id, data));
      return;
    }

    case "delete": {
      const id = getRequired(idOrFirst, "itineraryId");
      await deleteItineraryById(id);
      writeSuccess({ deleted: true, id });
      return;
    }

    case "chat": {
      const itineraryId = getRequired(idOrFirst, "itineraryId 或 new");
      const message = getRequired(rest.join(" ").trim(), "message");
      const history = parseJsonFlag(args.flags, "history");
      const streamParams = {
        message,
        history: Array.isArray(history) ? history : undefined,
        itineraryContext: getStringFlag(args.flags, "context"),
        itineraryId,
        userId: getStringFlag(args.flags, "userId") ?? "demo-user-001",
      };

      if (args.flags.stream) {
        const stream = await createPlanStream(streamParams);
        for await (const event of stream) {
          process.stdout.write(`${JSON.stringify(event)}\n`);
        }
        process.stdout.write(`${JSON.stringify({ type: "done" })}\n`);
        return;
      }

      const result = await runPlanChat(streamParams);
      writeSuccess(result);
      return;
    }

    default:
      throw new CliError("INVALID_ARGUMENT", "未知 plan 命令");
  }
}

async function handlePreference(args: ParsedArgs): Promise<void> {
  const [command, userIdArg] = args.positional;
  const userId = getRequired(userIdArg, "userId");

  switch (command) {
    case "get": {
      writeSuccess(await getPreferenceByUserId(userId));
      return;
    }

    case "set": {
      const preference = await upsertPreference(userId, parsePreferenceInput(args.flags));
      if (!preference) {
        throw new CliError("USER_NOT_FOUND", "用户不存在", 2);
      }
      writeSuccess(preference);
      return;
    }

    case "delete": {
      const deleted = await deletePreferenceByUserId(userId);
      if (!deleted) {
        throw new CliError("PREFERENCE_NOT_FOUND", "用户偏好不存在", 2);
      }
      writeSuccess({ deleted: true, userId });
      return;
    }

    default:
      throw new CliError("INVALID_ARGUMENT", "未知 preference 命令");
  }
}

async function main(): Promise<void> {
  const [resource, ...rest] = process.argv.slice(2);

  if (!resource || resource === "help" || resource === "--help") {
    printHelp();
    return;
  }

  const parsed = parseArgs(rest);

  switch (resource) {
    case "plan":
      await handlePlan(parsed);
      return;
    case "preference":
      await handlePreference(parsed);
      return;
    default:
      throw new CliError("INVALID_ARGUMENT", "未知资源类型");
  }
}

main()
  .catch(writeError)
  .finally(async () => {
    await closeRedis();
    await prisma.$disconnect();
  });
