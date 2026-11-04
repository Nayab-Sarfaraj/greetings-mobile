export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message, 404);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}
export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super("VALIDATION_ERROR", message, 400);
  }
}
export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super("RATE_LIMITED", message, 429);
  }
}
export class PaymentRequiredError extends AppError {
  constructor(message = "Payment required") {
    super("PAYMENT_REQUIRED", message, 402);
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof AppError)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
}
