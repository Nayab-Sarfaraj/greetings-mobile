import type { PublicResult } from "@greetings/shared";
import { resultRepository } from "./result.repository";
import { NotFoundError } from "../../lib/errors";
export function createResultService(repository: typeof resultRepository) {
  return {
    async get(id: string): Promise<PublicResult> {
      if (!/^[A-Za-z0-9_-]{22}$/.test(id)) throw new NotFoundError();
      const item = await repository.find(id);
      if (!item) throw new NotFoundError();
      const { render } = item;
      const props = render.input.props;
      const status =
        render.status === "ready"
          ? "ready"
          : render.status === "failed"
            ? "failed"
            : "processing";
      return {
        shareId: id,
        status,
        type: props.type,
        title:
          props.type === "card"
            ? `A greeting from ${props.senderName}`
            : props.eventTitle,
        theme: props.themeId,
        ...(status === "ready" && render.fileUrl && render.posterUrl
          ? { videoUrl: render.fileUrl, posterUrl: render.posterUrl }
          : {}),
      };
    },
  };
}
export const resultService = createResultService(resultRepository);
