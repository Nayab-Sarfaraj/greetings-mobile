import { revalidatePath } from "next/cache";
import { requireUser } from "../../middleware/auth";
import { errorResponse } from "../../lib/errors";
import { validate } from "../../lib/validation";
import { invitationInput } from "./invitation.schema";
import { invitationService } from "./invitation.service";
import { invitationDto } from "./invitation.mapper";
type Context = { params: Promise<{ id: string }> };
export async function list() {
  try {
    return Response.json(
      (await invitationService.list(await requireUser())).map(invitationDto),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function create(request: Request) {
  try {
    const owner = await requireUser();
    const input = validate(invitationInput, await request.json());
    return Response.json(
      invitationDto(await invitationService.create(owner, input)),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function get(_request: Request, context: Context) {
  try {
    return Response.json(
      invitationDto(
        await invitationService.get(
          await requireUser(),
          (await context.params).id,
        ),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function update(request: Request, context: Context) {
  try {
    const owner = await requireUser();
    return Response.json(
      invitationDto(
        await invitationService.update(
          owner,
          (await context.params).id,
          validate(invitationInput, await request.json()),
        ),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function remove(_request: Request, context: Context) {
  try {
    const deleted = await invitationService.delete(
      await requireUser(),
      (await context.params).id,
    );
    if (deleted.shareId) revalidatePath(`/c/${String(deleted.shareId)}`);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
