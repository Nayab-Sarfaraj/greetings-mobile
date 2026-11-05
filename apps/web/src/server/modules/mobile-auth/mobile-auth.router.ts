import { errorResponse } from "../../lib/errors";
import { requireUser } from "../../middleware/auth";
import { createMobileSignInTicket } from "./mobile-auth.service";

export async function create() {
  try {
    return Response.json(await createMobileSignInTicket(await requireUser()));
  } catch (error) {
    return errorResponse(error);
  }
}
