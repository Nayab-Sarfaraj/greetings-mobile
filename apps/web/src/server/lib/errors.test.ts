import { describe, expect, it } from "vitest";
import { AppError, errorResponse } from "./errors";
describe("error envelope", () => {
  it("maps typed errors to HTTP responses", async () => {
    const response = errorResponse(new AppError("TEST", "Test failure", 409));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code: "TEST", message: "Test failure" },
    });
  });
});
