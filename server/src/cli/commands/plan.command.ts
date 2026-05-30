import { AppError } from "../../contracts/errors";
import {
  estimatePlanBudget,
  optimizePlan,
  rejectDeprecatedPlanGeneration,
  validatePlan,
} from "../../services/plan.service";
import { getRequired, parseJsonFlag, ParsedArgs } from "../parser";
import { writeSuccess } from "../output";

function parsePlanData(flags: ParsedArgs["flags"]): unknown {
  const data = parseJsonFlag(flags, "data");
  if (data === undefined) {
    throw new AppError("INVALID_ARGUMENT", "缺少 --data JSON", 2, 400);
  }
  return data;
}

export async function handlePlan(args: ParsedArgs): Promise<void> {
  const [command] = args.positional;

  switch (command) {
    case "validate": {
      writeSuccess(validatePlan(parsePlanData(args.flags)));
      return;
    }
    case "estimate-budget": {
      writeSuccess(estimatePlanBudget(parsePlanData(args.flags)));
      return;
    }
    case "optimize-order": {
      writeSuccess(optimizePlan(parsePlanData(args.flags)));
      return;
    }
    case "chat":
    case "generate": {
      rejectDeprecatedPlanGeneration();
      return;
    }
    default:
      throw new AppError(
        "INVALID_ARGUMENT",
        `未知 plan 命令：${getRequired(command, "command")}`,
        2,
        400
      );
  }
}

