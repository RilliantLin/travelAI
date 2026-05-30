export type AppErrorCode =
  | "COMMAND_ERROR"
  | "INVALID_ARGUMENT"
  | "RESOURCE_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "ITINERARY_NOT_FOUND"
  | "PREFERENCE_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "SANDBOX_RESTRICTED";

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public exitCode: number = 1,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError("COMMAND_ERROR", error.message);
  }

  return new AppError("COMMAND_ERROR", "命令执行失败");
}

