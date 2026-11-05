import { readTextBody } from "../../lib/read-body";
import { errorResponse, ValidationError } from "../../lib/errors";
import { validate } from "../../lib/validation";
import { requireUser } from "../../middleware/auth";
import { generateMessageInput } from "./message.schema";
import { messageService } from "./message.service";

export async function generate(request: Request) {
  try {
    const owner = await requireUser();
    let raw: unknown;
    try {
      raw = JSON.parse(await readTextBody(request, 16384));
    } catch {
      throw new ValidationError("Invalid message request");
    }
    return Response.json(
      await messageService.generate(
        owner,
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        validate(generateMessageInput, raw),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
