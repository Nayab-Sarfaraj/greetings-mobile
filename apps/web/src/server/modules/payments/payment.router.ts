import { readTextBody } from "../../lib/read-body";
import { z } from "zod";
import {
  verifyPolarEvent,
  polarWebhookErrors,
} from "../../integrations/polar.client";
import { paymentService } from "./payment.service";
import { checkoutService } from "./checkout.service";
import { checkoutInput } from "./checkout.schema";
import { validate } from "../../lib/validation";
import { errorResponse, ValidationError } from "../../lib/errors";
import { requireUser } from "../../middleware/auth";
export async function packs() {
  try {
    return Response.json(await checkoutService.catalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function checkout(request: Request) {
  try {
    const owner = await requireUser();
    let body: unknown;
    try {
      body = JSON.parse(await readTextBody(request, 16384));
    } catch {
      throw new ValidationError("Invalid checkout request");
    }
    return Response.json(
      await checkoutService.create(
        owner,
        validate(checkoutInput, body),
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function webhook(request: Request) {
  try {
    const body = await readTextBody(request, 1048576);
    const headers = Object.fromEntries(request.headers.entries());
    const event = await verifyPolarEvent(body, headers);
    if (!["order.paid", "order.refunded", "order.updated"].includes(event.type))
      return Response.json({ received: true });
    const id = request.headers.get("webhook-id");
    if (!id || id.length > 200)
      throw new ValidationError("Invalid webhook identifier");
    await paymentService.receive(id, event);
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof polarWebhookErrors.PolarWebhookVerificationError)
      return Response.json(
        {
          error: {
            code: "INVALID_SIGNATURE",
            message: "Invalid webhook signature",
          },
        },
        { status: 400 },
      );
    if (error instanceof polarWebhookErrors.PolarWebhookUnknownTypeError)
      return Response.json({ received: true });
    return errorResponse(error);
  }
}

export async function status(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await requireUser();
    const { id } = validate(z.object({ id: z.uuid() }), await context.params);
    return Response.json(await checkoutService.status(owner, id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
