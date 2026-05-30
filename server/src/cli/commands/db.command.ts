import prisma from "../../config/database";
import { AppError } from "../../contracts/errors";
import { ParsedArgs } from "../parser";
import { writeSuccess } from "../output";

export async function handleDb(args: ParsedArgs): Promise<void> {
  const [command] = args.positional;

  switch (command) {
    case "status": {
      await prisma.$queryRaw`SELECT 1`;
      writeSuccess({ connected: true });
      return;
    }
    case "migrate":
    case "seed":
      throw new AppError(
        "SANDBOX_RESTRICTED",
        `${command} 是危险数据库命令，请在受控终端中手动执行`,
        4,
        403
      );
    default:
      throw new AppError("INVALID_ARGUMENT", "未知 db 命令", 2, 400);
  }
}

