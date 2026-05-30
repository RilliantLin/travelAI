#!/usr/bin/env node

process.env.TRAVEL_CLI = "true";

import "../config/env";
import prisma from "../config/database";
import { closeRedis } from "../config/redis";
import { AppError } from "../contracts/errors";
import { parseArgs } from "./parser";
import { writeError, writeSuccess } from "./output";
import { handleDb } from "./commands/db.command";
import { handleItinerary } from "./commands/itinerary.command";
import { handleMap } from "./commands/map.command";
import { handlePlan } from "./commands/plan.command";
import { handlePreference } from "./commands/preference.command";
import { handleUser } from "./commands/user.command";

function printHelp(): void {
  writeSuccess({
    usage: "travel <db|user|preference|itinerary|map|plan> <command> [args] [--flags]",
    commands: [
      "db status --json",
      "user get <userId> --json",
      "user create --email <email> [--name <name>] --json",
      "preference get <userId> --json",
      "preference set <userId> --data '<json>' --json",
      "preference delete <userId> --json",
      "itinerary list [--userId <userId>] --json",
      "itinerary get <itineraryId> --json",
      "itinerary create --data '<json>' --json",
      "itinerary update <itineraryId> --data '<json>' --json",
      "itinerary delete <itineraryId> --json",
      "map geocode <address> --json",
      "map search-poi --city <city> --keyword <keyword> [--limit <n>] --json",
      "map route --from <origin> --to <destination> [--mode walking|driving|transit|bicycling] --json",
      "plan validate --data '<json>' --json",
      "plan estimate-budget --data '<json>' --json",
      "plan optimize-order --data '<json>' --json",
    ],
    deprecated: ["plan chat", "plan generate"],
  });
}

async function main(): Promise<void> {
  const [resource, ...rest] = process.argv.slice(2);

  if (!resource || resource === "help" || resource === "--help") {
    printHelp();
    return;
  }

  const parsed = parseArgs(rest);

  switch (resource) {
    case "db":
      await handleDb(parsed);
      return;
    case "user":
      await handleUser(parsed);
      return;
    case "preference":
      await handlePreference(parsed);
      return;
    case "itinerary":
    case "plan-list":
      await handleItinerary(parsed);
      return;
    case "map":
      await handleMap(parsed);
      return;
    case "plan":
      await handlePlan(parsed);
      return;
    default:
      throw new AppError("INVALID_ARGUMENT", "未知资源类型", 2, 400);
  }
}

main()
  .catch(writeError)
  .finally(async () => {
    await closeRedis();
    await prisma.$disconnect();
  });

