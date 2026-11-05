import { requireUser } from "../../middleware/auth";
import { errorResponse, ValidationError } from "../../lib/errors";
import { readTextBody } from "../../lib/read-body";
import { validate } from "../../lib/validation";
import { guestDto } from "./guest.mapper";
import { guestImportInput, guestInput } from "./guest.schema";
import { guestService } from "./guest.service";

type Context = { params: Promise<{ id: string; guestId?: string }> };

async function body(request: Request) {
  try {
    return JSON.parse(await readTextBody(request, 65536)) as unknown;
  } catch {
    throw new ValidationError("Invalid guest request");
  }
}

export async function list(_request: Request, context: Context) {
  try {
    const owner = await requireUser();
    return Response.json(
      (await guestService.list(owner, (await context.params).id)).map(guestDto),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function add(request: Request, context: Context) {
  try {
    const owner = await requireUser();
    const result = await guestService.add(
      owner,
      (await context.params).id,
      validate(guestInput, await body(request)),
    );
    return Response.json(
      { ...result, guests: result.guests.map(guestDto) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function importGuests(request: Request, context: Context) {
  try {
    const owner = await requireUser();
    const input = validate(guestImportInput, await body(request));
    const result = await guestService.import(
      owner,
      (await context.params).id,
      input.guests,
    );
    return Response.json({ ...result, guests: result.guests.map(guestDto) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function remove(_request: Request, context: Context) {
  try {
    const owner = await requireUser();
    const { id, guestId } = await context.params;
    await guestService.remove(owner, id, String(guestId));
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function removeAll(_request: Request, context: Context) {
  try {
    const count = await guestService.removeAll(
      await requireUser(),
      (await context.params).id,
    );
    return Response.json({ deleted: count });
  } catch (error) {
    return errorResponse(error);
  }
}
