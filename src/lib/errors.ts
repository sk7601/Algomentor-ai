export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure<T>(error: string): ActionResult<T> {
  return { success: false, error };
}
