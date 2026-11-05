import { entitlementService } from "../entitlements/entitlement.service";
import { NotFoundError } from "../../lib/errors";
import { polarClient, type PolarClient } from "../../integrations/polar.client";
import {
  checkoutEnabled,
  paymentSettings,
  localRenderConfig,
} from "../../lib/config";
import { invitationService } from "../invitations/invitation.service";
import { checkoutRepository } from "./checkout.repository";
import { ValidationError, AppError } from "../../lib/errors";
import { rateLimit } from "../../lib/rate-limit";
import type { z } from "zod";
import type { checkoutInput } from "./checkout.schema";
const defaults = {
  client: polarClient,
  invitations: invitationService,
  repository: checkoutRepository,
  enabled: checkoutEnabled,
  settings: paymentSettings,
  appUrl: () => localRenderConfig().appUrl,
  limit: rateLimit,
};
export function createCheckoutService(deps: typeof defaults) {
  return {
    async status(owner: string, id: string) {
      if (
        !(await deps.repository.owned(owner, id, deps.settings().environment))
      )
        throw new NotFoundError();
      const receipt = await deps.repository.receipt(owner, id);
      return {
        confirmed: Boolean(receipt),
        refunded: Boolean(receipt && receipt.revokedCredits >= receipt.credits),
        balance: await entitlementService.getBalance(owner),
      };
    },
    async catalog() {
      if (!deps.enabled()) return { enabled: false, packs: [] };
      const settings = deps.settings();
      return {
        enabled: true,
        packs: (
          await Promise.all(
            settings.packs.map((pack) => deps.client.offer(pack)),
          )
        ).map(({ id, name, credits, amount, currency }) => ({
          id,
          name,
          credits,
          amount,
          currency,
        })),
      };
    },
    async create(
      owner: string,
      input: z.infer<typeof checkoutInput>,
      ip?: string,
    ) {
      if (!deps.enabled())
        throw new AppError(
          "UNAVAILABLE",
          "Export packs are temporarily unavailable",
          503,
        );
      const settings = deps.settings();
      const pack = settings.packs.find((item) => item.id === input.packId);
      if (!pack) throw new ValidationError("Choose an available export pack");
      const invitation = await deps.invitations.get(owner, input.invitationId);
      await deps.limit(`checkout:${owner}`, 10);
      if (ip) {
        const { createHash } = await import("node:crypto");
        await deps.limit(
          `checkout-ip:${createHash("sha256").update(ip).digest("hex")}`,
          30,
        );
      }
      await deps.client.offer(pack, true);
      const back = new URL(
        `/create/${String(invitation.templateId)}`,
        deps.appUrl(),
      );
      back.searchParams.set("draft", input.invitationId);
      back.searchParams.set("checkout", "cancelled");
      const success = new URL(back);
      success.searchParams.set("checkout", "success");
      success.searchParams.set("checkout_id", "{CHECKOUT_ID}");
      const session = await deps.client.checkout({
        owner,
        productId: pack.productId,
        successUrl: success
          .toString()
          .replace("%7BCHECKOUT_ID%7D", "{CHECKOUT_ID}"),
        returnUrl: back.toString(),
      });
      const checkoutUrl = new URL(session.url);
      if (
        checkoutUrl.protocol !== "https:" ||
        !["checkout.polar.sh", "sandbox.polar.sh", "polar.sh"].includes(
          checkoutUrl.hostname,
        )
      )
        throw new Error("Unexpected checkout destination");
      await deps.repository.save({
        _id: session.id,
        clerkId: owner,
        productId: pack.productId,
        credits: pack.credits,
        environment: settings.environment,
      });
      return { url: session.url, id: session.id };
    },
  };
}
export const checkoutService = createCheckoutService(defaults);
export type { PolarClient };
