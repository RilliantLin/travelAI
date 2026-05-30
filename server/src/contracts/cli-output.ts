import { AppErrorCode } from "./errors";

export interface CliSuccess<T = unknown> {
  ok: true;
  data: T;
}

export interface CliFailure {
  ok: false;
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
  };
}

export type CliOutput<T = unknown> = CliSuccess<T> | CliFailure;

export const CLI_EXIT_CODES = {
  success: 0,
  failure: 1,
  argumentOrNotFound: 2,
  externalService: 3,
  sandbox: 4,
  validation: 5,
} as const;

