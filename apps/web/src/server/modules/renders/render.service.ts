import { paymentSettings } from "../../lib/config";
import {
  paidRenderRepository,
  RenderRetryLimit,
} from "./paid-render.repository";
import { InsufficientBalance } from "../entitlements/entitlement.repository";
import type { RenderTier } from "./render.model";
import { bindResult, publishResults } from "../results/publication.service";
import { validate } from "../../lib/validation";
import { createHash } from "node:crypto";
import { invitationService } from "../invitations/invitation.service";
import { renderRepository } from "./render.repository";
import { invitationInput } from "../invitations/invitation.schema";
import { assertOwnedPhoto } from "../../integrations/local-storage.client";
import {
  NotFoundError,
  ValidationError,
  RateLimitError,
  PaymentRequiredError,
} from "../../lib/errors";
import { rateLimit } from "../../lib/rate-limit";
export function canonical(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}
const defaultDependencies = {
  invitations: invitationService,
  renders: renderRepository,
  limit: rateLimit,
  checkPhoto: assertOwnedPhoto,
  bindResult,
  reserveHd: paidRenderRepository.reserve,
  environment: () => paymentSettings().environment,
};
export function createRenderService(deps: typeof defaultDependencies) {
  return {
    async request(
      owner: string,
      id: string,
      ip?: string,
      quality: RenderTier = "free",
    ) {
      const item = await deps.invitations.get(owner, id);
      const input = validate(invitationInput, {
        templateId: item.templateId,
        props: item.props,
        hostContact: item.hostContact,
      });
      if (input.props.photoUrl) {
        try {
          await deps.checkPhoto(input.props.photoUrl, owner);
        } catch {
          throw new ValidationError("Photo does not belong to your account");
        }
      }
      const environment = quality === "hd" ? deps.environment() : undefined;
      const propsHash = createHash("sha256")
        .update(
          canonical({
            owner,
            billingEnvironment: environment,
            templateId: input.templateId,
            props: input.props,
            tier:
              quality === "hd"
                ? "hd-1080p-clean-v1"
                : "free-720p-watermarked-v1",
          }),
        )
        .digest("hex");
      const cached = await deps.renders.find(owner, propsHash);
      if (cached && cached.status !== "failed") {
        await deps.renders.attach(owner, propsHash, id);
        await deps.bindResult(owner, id, cached);
        return cached;
      }
      await deps.limit(`render:${owner}`, 10);
      if (ip)
        await deps.limit(
          `render-ip:${createHash("sha256").update(ip).digest("hex")}`,
          30,
        );
      if (quality === "hd") {
        try {
          const job = await deps.reserveHd(
            owner,
            id,
            propsHash,
            input,
            environment!,
          );
          if (job) await deps.bindResult(owner, id, job);
          return job;
        } catch (error) {
          if (error instanceof InsufficientBalance)
            throw new PaymentRequiredError(
              "Choose an export pack to make this HD video",
            );
          if (error instanceof RenderRetryLimit)
            throw new RateLimitError(
              "This video has reached its retry limit. Change the content before exporting again.",
            );
          throw error;
        }
      }
      if (cached) {
        const retried = await deps.renders.retry(owner, propsHash);
        if (!retried) {
          const current = await deps.renders.find(owner, propsHash);
          if (current && current.status !== "failed") {
            await deps.bindResult(owner, id, current);
            return current;
          }
          throw new RateLimitError(
            "This video has reached its retry limit. Change the content before exporting again.",
          );
        }
        await deps.bindResult(owner, id, retried);
        return retried;
      }
      const job = await deps.renders.enqueue(owner, id, propsHash, input);
      if (job) await deps.bindResult(owner, id, job);
      return job;
    },
    async get(owner: string, id: string) {
      if (!/^[a-f0-9]{24}$/i.test(id)) throw new NotFoundError();
      await deps.renders.sweep();
      const item = await deps.renders.get(owner, id);
      if (!item) throw new NotFoundError();
      if (item.status === "ready") await publishResults(owner, id);
      return item;
    },
  };
}
export const renderService = createRenderService(defaultDependencies);
export const requestRender = renderService.request;
export const getRender = renderService.get;

export async function listRenderJobs(owner: string) {
  await renderRepository.sweep();
  return renderRepository.list(owner);
}
