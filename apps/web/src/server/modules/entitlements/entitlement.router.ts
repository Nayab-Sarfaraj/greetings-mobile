import { requireUser } from "../../middleware/auth";
import { entitlementService } from "./entitlement.service";
import { errorResponse } from "../../lib/errors";
export async function get() {
  try {
    return Response.json(
      { balance: await entitlementService.getBalance(await requireUser()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
