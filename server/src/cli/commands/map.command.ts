import { AppError } from "../../contracts/errors";
import { geocode, getRoute, searchPoi } from "../../services/map.service";
import {
  getNumberFlag,
  getRequired,
  getStringFlag,
  ParsedArgs,
} from "../parser";
import { writeSuccess } from "../output";

export async function handleMap(args: ParsedArgs): Promise<void> {
  const [command, first] = args.positional;

  switch (command) {
    case "geocode": {
      writeSuccess(await geocode(getRequired(first, "address")));
      return;
    }

    case "search-poi": {
      writeSuccess(
        await searchPoi({
          city: getStringFlag(args.flags, "city"),
          keyword: getRequired(getStringFlag(args.flags, "keyword") ?? first, "keyword"),
          limit: getNumberFlag(args.flags, "limit"),
          location: getStringFlag(args.flags, "location"),
          types: getStringFlag(args.flags, "types"),
          radius: getNumberFlag(args.flags, "radius"),
        })
      );
      return;
    }

    case "route": {
      const mode = getStringFlag(args.flags, "mode");
      if (mode && !["driving", "walking", "transit", "bicycling"].includes(mode)) {
        throw new AppError("INVALID_ARGUMENT", "--mode 不合法", 2, 400);
      }

      writeSuccess(
        await getRoute({
          from: getRequired(getStringFlag(args.flags, "from"), "from"),
          to: getRequired(getStringFlag(args.flags, "to"), "to"),
          mode: mode as "driving" | "walking" | "transit" | "bicycling" | undefined,
        })
      );
      return;
    }

    default:
      throw new AppError("INVALID_ARGUMENT", "未知 map 命令", 2, 400);
  }
}

