import { AppError } from "../../contracts/errors";
import { createUser, getUser } from "../../services/user.service";
import { getRequired, getStringFlag, ParsedArgs } from "../parser";
import { writeSuccess } from "../output";

export async function handleUser(args: ParsedArgs): Promise<void> {
  const [command, id] = args.positional;

  switch (command) {
    case "get": {
      writeSuccess(await getUser(getRequired(id, "userId")));
      return;
    }
    case "create": {
      const email = getRequired(getStringFlag(args.flags, "email"), "email");
      writeSuccess(
        await createUser({
          email,
          name: getStringFlag(args.flags, "name"),
          avatar: getStringFlag(args.flags, "avatar"),
        })
      );
      return;
    }
    default:
      throw new AppError("INVALID_ARGUMENT", "未知 user 命令", 2, 400);
  }
}

