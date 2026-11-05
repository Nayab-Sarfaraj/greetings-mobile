import { renderChoice } from "./render.schema";
import { validate } from "../../lib/validation";
import { ValidationError } from "../../lib/errors";
import { requireUser } from "../../middleware/auth";
import { errorResponse } from "../../lib/errors";
import { getRender, requestRender } from "./render.service";
import { renderDto } from "./render.mapper";
export async function create(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await requireUser();
    const body = await request.text();
    let raw: unknown;
    try {
      raw = body ? JSON.parse(body) : {};
    } catch {
      throw new ValidationError("Invalid export request");
    }
    const choice = validate(renderChoice, raw);
    const item = await requestRender(
      owner,
      (await context.params).id,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      choice.quality,
    );
    if (!item) throw new Error("Render queue unavailable");
    return Response.json(renderDto(item), { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function get(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return Response.json(
      renderDto(
        await getRender(await requireUser(), (await context.params).id),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function list() {
  try {
    const { listRenderJobs } = await import("./render.service");
    return Response.json(
      (await listRenderJobs(await requireUser())).map(renderDto),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
