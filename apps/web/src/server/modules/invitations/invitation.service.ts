import { cleanInvitation } from "./invitation-cleanup.service";
import { getTemplate } from "@greetings/remotion/templates";
import { NotFoundError, ValidationError } from "../../lib/errors";
import type { InvitationInput } from "./invitation.schema";
import { invitationRepository } from "./invitation.repository";
export function createInvitationService(
  repository: typeof invitationRepository,
) {
  function check(input: InvitationInput) {
    const template = getTemplate(input.templateId);
    if (
      !template ||
      template.type !== input.props.type ||
      template.themeId !== input.props.themeId
    )
      throw new ValidationError("Template and content do not match");
    if (input.props.type === "invitation" && !input.hostContact)
      throw new ValidationError("Add a host reply contact");
  }
  function checkId(id: string) {
    if (!/^[a-f0-9]{24}$/i.test(id)) throw new NotFoundError();
  }
  return {
    list: (owner: string) => repository.list(owner),
    async get(owner: string, id: string) {
      checkId(id);
      const item = await repository.get(owner, id);
      if (!item) throw new NotFoundError();
      return item;
    },
    async create(owner: string, input: InvitationInput) {
      check(input);
      return repository.create(owner, input);
    },
    async update(owner: string, id: string, input: InvitationInput) {
      checkId(id);
      check(input);
      const item = await repository.update(owner, id, input);
      if (!item) throw new NotFoundError();
      return item;
    },
    async delete(owner: string, id: string) {
      checkId(id);
      const item = await repository.delete(owner, id);
      if (!item) throw new NotFoundError();
      await cleanInvitation(owner, id);
      return item;
    },
  };
}
export const invitationService = createInvitationService(invitationRepository);
