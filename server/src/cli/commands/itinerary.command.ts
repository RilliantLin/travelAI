import { AppError } from "../../contracts/errors";
import {
  createItinerary,
  deleteItineraryById,
  listItineraries,
  requireItineraryById,
  updateItinerary,
} from "../../services/itinerary.service";
import {
  getRequired,
  getStringFlag,
  parseJsonFlag,
  ParsedArgs,
} from "../parser";
import { writeSuccess } from "../output";

function parseData(flags: ParsedArgs["flags"]): unknown {
  const data = parseJsonFlag(flags, "data");
  if (data === undefined) {
    throw new AppError("INVALID_ARGUMENT", "缺少 --data JSON", 2, 400);
  }
  return data;
}

export async function handleItinerary(args: ParsedArgs): Promise<void> {
  const [command, idOrFirst] = args.positional;

  switch (command) {
    case "list": {
      writeSuccess(await listItineraries(getStringFlag(args.flags, "userId")));
      return;
    }

    case "get": {
      writeSuccess(await requireItineraryById(getRequired(idOrFirst, "itineraryId")));
      return;
    }

    case "create": {
      writeSuccess(await createItinerary(parseData(args.flags)));
      return;
    }

    case "update": {
      writeSuccess(
        await updateItinerary(getRequired(idOrFirst, "itineraryId"), parseData(args.flags))
      );
      return;
    }

    case "delete": {
      const id = getRequired(idOrFirst, "itineraryId");
      await deleteItineraryById(id);
      writeSuccess({ deleted: true, id });
      return;
    }

    default:
      throw new AppError("INVALID_ARGUMENT", "未知 itinerary 命令", 2, 400);
  }
}

