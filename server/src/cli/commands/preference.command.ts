import { AppError } from "../../contracts/errors";
import {
  deletePreferenceByUserId,
  getPreferenceByUserId,
  upsertPreference,
} from "../../services/preference.service";
import {
  getBooleanFlag,
  getNumberFlag,
  getRequired,
  getStringFlag,
  parseJsonFlag,
  ParsedArgs,
} from "../parser";
import { writeSuccess } from "../output";

function parsePreferenceInput(flags: ParsedArgs["flags"]): Record<string, unknown> {
  const jsonInput = parseJsonFlag(flags, "data");
  if (jsonInput !== undefined) {
    if (!jsonInput || typeof jsonInput !== "object" || Array.isArray(jsonInput)) {
      throw new AppError("INVALID_ARGUMENT", "--data 必须是 JSON 对象", 2, 400);
    }
    return jsonInput as Record<string, unknown>;
  }

  const input: Record<string, unknown> = {};
  const numericFields = ["budgetMin", "budgetMax", "travelerCount"];
  const stringFields = ["currency", "travelStyle", "transportPreference", "accommodationType"];
  const arrayFields = ["dietaryRestrictions", "preferredActivities"];

  for (const field of numericFields) {
    const value = getNumberFlag(flags, field);
    if (value !== undefined) input[field] = value;
  }

  for (const field of stringFields) {
    const value = getStringFlag(flags, field);
    if (value !== undefined) input[field] = value;
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
    input.accessibilityNeeds = getBooleanFlag(flags, "accessibilityNeeds");
  }

  return input;
}

export async function handlePreference(args: ParsedArgs): Promise<void> {
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
        throw new AppError("USER_NOT_FOUND", "用户不存在", 2, 404);
      }
      writeSuccess(preference);
      return;
    }

    case "delete": {
      const deleted = await deletePreferenceByUserId(userId);
      if (!deleted) {
        throw new AppError("PREFERENCE_NOT_FOUND", "用户偏好不存在", 2, 404);
      }
      writeSuccess({ deleted: true, userId });
      return;
    }

    default:
      throw new AppError("INVALID_ARGUMENT", "未知 preference 命令", 2, 400);
  }
}

