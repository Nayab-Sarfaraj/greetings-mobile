import { createHash, randomBytes } from "node:crypto";
import { getTemplate } from "@greetings/remotion/templates";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { rateLimit } from "../../lib/rate-limit";
import { invitationService } from "../invitations/invitation.service";
import { invitationInput } from "../invitations/invitation.schema";
import {
  GuestCapacityError,
  guestRepository,
} from "./guest.repository";
import type { GuestInputRecord } from "./guest.schema";

const MAX_GUESTS = 200;

function normalized(input: GuestInputRecord) {
  const name = input.name
    .normalize("NFKC")
    .replace(/^[=+\-@]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name || name.length > 40)
    throw new ValidationError("Guest name must be between 1 and 40 characters");
  return { name, nameKey: name.toLocaleLowerCase("en-US"), contact: input.contact };
}

function checkId(id: string) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new NotFoundError();
}

type Dependencies = {
  repository: typeof guestRepository;
  invitations: typeof invitationService;
  limit: typeof rateLimit;
  token: () => string;
};

export function createGuestService(deps: Dependencies) {
  async function invitation(owner: string, id: string) {
    checkId(id);
    const item = await deps.invitations.get(owner, id);
    if (item.props.type !== "invitation")
      throw new ValidationError("Guests can only be added to invitations");
    return item;
  }
  async function save(owner: string, id: string, inputs: GuestInputRecord[]) {
    await invitation(owner, id);
    const unique = new Map<string, ReturnType<typeof normalized>>();
    for (const input of inputs) {
      const item = normalized(input);
      const current = unique.get(item.nameKey);
      unique.set(item.nameKey, {
        ...item,
        contact: item.contact ?? current?.contact,
      });
    }
    const batch = [...unique.values()];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await deps.repository.saveBatch(
          id,
          batch.map((item) => ({ ...item, token: deps.token() })),
          MAX_GUESTS,
        );
      } catch (error) {
        if (error instanceof GuestCapacityError)
          throw new ValidationError("An invitation can have at most 200 guests");
        if ((error as { code?: number }).code !== 11000 || attempt === 2)
          throw error;
      }
    }
    throw new Error("Guest links could not be created");
  }
  return {
    async list(owner: string, id: string) {
      await invitation(owner, id);
      return deps.repository.list(id);
    },
    add: (owner: string, id: string, input: GuestInputRecord) =>
      save(owner, id, [input]),
    import: (owner: string, id: string, inputs: GuestInputRecord[]) =>
      save(owner, id, inputs),
    async remove(owner: string, invitationId: string, guestId: string) {
      await invitation(owner, invitationId);
      checkId(guestId);
      if (!(await deps.repository.remove(invitationId, guestId)))
        throw new NotFoundError();
    },
    async removeAll(owner: string, id: string) {
      await invitation(owner, id);
      return deps.repository.removeAll(id);
    },
    async public(token: string, ip?: string) {
      if (ip)
        await deps.limit(
          `guest-link:${createHash("sha256").update(ip).digest("hex")}`,
          120,
        );
      if (!/^[A-Za-z0-9_-]{22}$/.test(token)) throw new NotFoundError();
      const item = await deps.repository.findPublic(token);
      if (!item) throw new NotFoundError();
      const parsed = invitationInput.safeParse({
        templateId: item.invitation.templateId,
        props: item.invitation.props,
        hostContact: item.invitation.hostContact,
      });
      const template = getTemplate(String(item.invitation.templateId));
      if (
        !parsed.success ||
        !template ||
        template.type !== "invitation" ||
        parsed.data.props.type !== "invitation" ||
        !parsed.data.hostContact
      )
        throw new NotFoundError();
      const props = {
        ...parsed.data.props,
        guestName: item.guest.name,
      };
      return {
        guestName: item.guest.name,
        eventTitle: props.eventTitle,
        templateId: template.id,
        props,
        hostContact: parsed.data.hostContact,
        videoUrl: item.render?.fileUrl,
        posterUrl: item.render?.posterUrl,
      };
    },
  };
}

export const guestService = createGuestService({
  repository: guestRepository,
  invitations: invitationService,
  limit: rateLimit,
  token: () => randomBytes(16).toString("base64url"),
});

export type PublicGuestInvitation = Awaited<
  ReturnType<typeof guestService.public>
>;
